// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IJoeRouter02.sol";
import "./IJoeFactory.sol";
import "./ISicleRouter02.sol";
import "./ISicleFactory.sol";

contract SwapOnAvalanche is Ownable {

    using SafeMath for uint256;
            
    IJoeRouter02 _joeV2Router;
    IJoeFactory _joeFactory;
    ISicleRouter02 _sicleV2Router;
    ISicleFactory _sicleFactory;

    uint8 pauseContract = 0;
    address ManagerWallet;
    address joeRouterAddress = 0x60aE616a2155Ee3d9A68541Ba4544862310933d4;     
    address joeFactoryAddress = 0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10;    
    address sicleRouterAddress = 0xC7f372c62238f6a5b79136A9e5D16A2FD7A3f0F5;
    address sicleFactoryAddress = 0x9C60C867cE07a3c403E2598388673C10259EC768;
    address nativeWrappedCurrencyAddr = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;

    event Received(address, uint);
    event Fallback(address, uint);
    event SetContractStatus(address addr, uint256 pauseValue);
    event WithdrawAll(address addr, uint256 token, uint256 native);

    constructor() 
    {          
        _joeV2Router = IJoeRouter02(joeRouterAddress);   
        _joeFactory = IJoeFactory(joeFactoryAddress);
        _sicleV2Router = ISicleRouter02(sicleRouterAddress);
        _sicleFactory = ISicleFactory(sicleFactoryAddress);
        ManagerWallet = 0xe28f60670529EE8d14277730CDA405e24Ac7251A;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    fallback() external payable { 
        emit Fallback(msg.sender, msg.value);
    }

    function wherePairExists(address _Atoken, address _Btoken) public view returns(uint8 ){                
        if( _sicleFactory.getPair(_Atoken, _Btoken) != address(0) || 
            (_sicleFactory.getPair(_Atoken, nativeWrappedCurrencyAddr) != address(0) && _sicleFactory.getPair(nativeWrappedCurrencyAddr, _Btoken) != address(0)) )
        {
            return 1;
        }
        else if( _joeFactory.getPair(_Atoken, _Btoken) != address(0) || 
            (_joeFactory.getPair(_Atoken, nativeWrappedCurrencyAddr) != address(0) && _joeFactory.getPair(nativeWrappedCurrencyAddr, _Btoken) != address(0)) )
        {
            return 2;
        } 
        else
        {
            return 0;
        }
    }

    function isSwapPathExists(address _Atoken, address _Btoken) public view returns(bool){        
        return ( _joeFactory.getPair(_Atoken, _Btoken) != address(0) || 
            (_joeFactory.getPair(_Atoken, nativeWrappedCurrencyAddr) != address(0) && _joeFactory.getPair(nativeWrappedCurrencyAddr, _Btoken) != address(0)) ) || 
            ( _sicleFactory.getPair(_Atoken, _Btoken) != address(0) || 
            (_sicleFactory.getPair(_Atoken, nativeWrappedCurrencyAddr) != address(0) && _sicleFactory.getPair(nativeWrappedCurrencyAddr, _Btoken) != address(0)) );
    }

    function getContractStatus() external view returns (uint8) {
        return pauseContract;
    }

    function setContractStatus(uint8 _newPauseContract) external onlyOwner {
        pauseContract = _newPauseContract;
        emit SetContractStatus(msg.sender, _newPauseContract);
    }

    function setjoeRouterAddress(address _addr) public onlyOwner{
        require(pauseContract == 0, "Contract Paused");
        require(_addr != address(0), "Invalid address");
        joeRouterAddress = _addr;
        _joeV2Router = IJoeRouter02(joeRouterAddress);   
    }

    function getjoeRouterAddress() public view returns(address){
        return joeRouterAddress;
    }

    function setjoeFactoryAddress(address _addr) public onlyOwner{
        require(pauseContract == 0, "Contract Paused");
        require(_addr != address(0), "Invalid address");
        joeFactoryAddress = _addr;
        _joeFactory = IJoeFactory(joeFactoryAddress);
    }

    function getjoeFactoryAddress() public view returns(address){
        return joeFactoryAddress;
    }

    function setSicleRouterAddress(address _addr) public onlyOwner{
        require(pauseContract == 0, "Contract Paused");
        require(_addr != address(0), "Invalid address");
        sicleRouterAddress = _addr;
        _sicleV2Router = ISicleRouter02(sicleRouterAddress);
    }

    function getSicleRouterAddress() public view returns(address){
        return sicleRouterAddress;
    }

    function setSicleFactoryAddress(address _addr) public onlyOwner{
        require(pauseContract == 0, "Contract Paused");
        require(_addr != address(0), "Invalid address");
        sicleFactoryAddress = _addr;
        _sicleFactory = ISicleFactory(sicleFactoryAddress);
    }

    function getSicleFactoryAddress() public view returns(address){
        return sicleFactoryAddress;
    }

    function setnativeWrappedCurrencyAddress(address _addr) public onlyOwner{
        require(pauseContract == 0, "Contract Paused");
        require(_addr != address(0), "Invalid address");
        nativeWrappedCurrencyAddr = _addr;
    }

    function getnativeWrappedCurrencyAddress() public view returns(address){
        return nativeWrappedCurrencyAddr;
    }

    function setManagerWallet(address _addr) public onlyOwner{
        require(pauseContract == 0, "Contract Paused");
        require(_addr != address(0), "Invalid address");
        ManagerWallet = _addr;
    }

    function getManagerWallet() public view returns(address){
        return ManagerWallet;
    }

    function swap(address _Aaddress, address _Baddress, uint256 _amountIn, uint256 _slippage) public 
    {
        require(pauseContract == 0, "Contract Paused");
        require(_amountIn > 0 , "Invalid amount");
        require(_slippage >= 0 && _slippage <= 100, "Invalid slippage.");
        require(IERC20(_Aaddress).balanceOf(msg.sender) > _amountIn, "Insufficient balance of A token.");

        uint8 whereToSwap = wherePairExists(_Aaddress, _Baddress);

        require(whereToSwap > 0, "No swap path.");

        IERC20 _tokenAContract = IERC20(_Aaddress);        
        _tokenAContract.transferFrom(msg.sender, address(this), _amountIn);    
        if(whereToSwap == 1) _tokenAContract.approve(address(_sicleV2Router), _amountIn);
        if(whereToSwap == 2) _tokenAContract.approve(address(_joeV2Router), _amountIn);
        
        uint256 _realAmountIn = _amountIn.mul(999).div(1000);   
        uint256 _realRequestedAmountOutMin  = getAmountOut(_Aaddress, _Baddress, _realAmountIn).mul(100 - _slippage).div(100);     

        address[] memory path;
        if (_Aaddress == nativeWrappedCurrencyAddr || _Baddress == nativeWrappedCurrencyAddr ) 
        {
            path = new address[](2);
            path[0] = _Aaddress;
            path[1] = _Baddress;
        }         
        else {
            path = new address[](3);
            path[0] = _Aaddress;
            path[1] = nativeWrappedCurrencyAddr;
            path[2] = _Baddress;           
        }   
        if(whereToSwap == 1)
        {
            _sicleV2Router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                _realAmountIn,
                _realRequestedAmountOutMin,
                path,
                address(msg.sender),
                block.timestamp           
            );
        }
        if(whereToSwap == 2)
        {
            _joeV2Router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                _realAmountIn,
                _realRequestedAmountOutMin,               
                path,
                address(msg.sender),
                block.timestamp
            );
        }
        _tokenAContract.transfer(ManagerWallet, _amountIn.sub(_realAmountIn));     
    }

    function swapExactAVAXForTokens(address _TokenAddress, uint256 _slippage) public payable{
        require(pauseContract == 0, "Contract Paused");
        require(_slippage >= 0 && _slippage <= 100, "Invalid slippage.");

        uint8 whereToSwap = wherePairExists(nativeWrappedCurrencyAddr, _TokenAddress);

        require(whereToSwap > 0, "No swap path.");

        address[] memory path = new address[](2);
        path[0] = nativeWrappedCurrencyAddr;
        path[1] = _TokenAddress;

        uint256 _realAmountIn = msg.value.mul(999).div(1000);   
        uint256 _realRequestedAmountOutMin  = getAmountOut(nativeWrappedCurrencyAddr, _TokenAddress, _realAmountIn).mul(100 - _slippage).div(100);    

        if(whereToSwap == 1)
        {
            _sicleV2Router.swapExactETHForTokensSupportingFeeOnTransferTokens{value: _realAmountIn}(                
                _realRequestedAmountOutMin,               
                path,
                address(msg.sender),
                block.timestamp
            );
        }
        if(whereToSwap == 2)
        {
            _joeV2Router.swapExactAVAXForTokensSupportingFeeOnTransferTokens{value: _realAmountIn}(                
                _realRequestedAmountOutMin,               
                path,
                address(msg.sender),
                block.timestamp
            );
        }

        payable(ManagerWallet).transfer(msg.value.sub(_realAmountIn));   
    }

    function swapExactTokenForAvax(address _TokenAddress, uint256 _amountIn, uint256 _slippage) public {
        require(pauseContract == 0, "Contract Paused");
        require(_amountIn > 0 , "Invalid amount");
        require(_slippage >= 0 && _slippage <= 100, "Invalid slippage.");

        uint8 whereToSwap = wherePairExists(nativeWrappedCurrencyAddr, _TokenAddress);

        require(whereToSwap > 0, "No swap path.");

        address[] memory path = new address[](2);
        path[0] = _TokenAddress;
        path[1] = nativeWrappedCurrencyAddr;
        
        IERC20 _tokenAContract = IERC20(_TokenAddress);        
        _tokenAContract.transferFrom(msg.sender, address(this), _amountIn);    
        _tokenAContract.approve(address(_joeV2Router), _amountIn);    

        uint256 _realAmountIn = _amountIn.mul(999).div(1000);   
        uint256 _realRequestedAmountOutMin  = getAmountOut(_TokenAddress, nativeWrappedCurrencyAddr, _realAmountIn).mul(100 - _slippage).div(100);    

        if(whereToSwap == 1)
        {            
            _sicleV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(   
                _realAmountIn,             
                _realRequestedAmountOutMin,               
                path,
                address(msg.sender),
                block.timestamp
            );
        }
        if(whereToSwap == 2)
        {
            _joeV2Router.swapExactTokensForAVAXSupportingFeeOnTransferTokens(   
                _realAmountIn,             
                _realRequestedAmountOutMin,               
                path,
                address(msg.sender),
                block.timestamp
            );
        }
        _tokenAContract.transfer(ManagerWallet, _amountIn.sub(_realAmountIn));     
    }

    function getBalanceOfToken(address _tokenAddr) public view returns(uint256){
        return IERC20(_tokenAddr).balanceOf(address(this));
    }

    function getAmountOut(address _Aaddress, address _Baddress, uint256 _amountIn) public view returns(uint256) { 
        require(_amountIn > 0 , "Invalid amount");

        uint8 whereToSwap = wherePairExists(_Aaddress, _Baddress);

        require(whereToSwap > 0, "No swap path.");

        address[] memory path;
        if (_Aaddress == nativeWrappedCurrencyAddr || _Baddress == nativeWrappedCurrencyAddr ) 
        {
            path = new address[](2);
            path[0] = _Aaddress;
            path[1] = _Baddress;
        } 
        else {
            path = new address[](3);
            path[0] = _Aaddress;
            path[1] = nativeWrappedCurrencyAddr;
            path[2] = _Baddress;
        }
        uint256[] memory amountOutMins;
        if(whereToSwap == 1) amountOutMins = _sicleV2Router.getAmountsOut(_amountIn, path);
        if(whereToSwap == 2) amountOutMins = _joeV2Router.getAmountsOut(_amountIn, path);
        return amountOutMins[path.length -1];  
    }
    
    function withdrawAll(address _addr) external onlyOwner{
        uint256 balance = IERC20(_addr).balanceOf(address(this));
        if(balance > 0) {
            IERC20(_addr).transfer(msg.sender, balance);
        }
        address payable mine = payable(msg.sender);
        if(address(this).balance > 0) {
            mine.transfer(address(this).balance);
        }
        emit WithdrawAll(msg.sender, balance, address(this).balance);
    }

    function getSelector(string calldata _func) external pure returns (bytes4) {
        return bytes4(keccak256(bytes(_func)));
    }
}

