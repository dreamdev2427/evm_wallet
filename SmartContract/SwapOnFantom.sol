// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IPancakeRouter02.sol";
import "./IPancakeFactory.sol";
import "./ISicleRouter02.sol";
import "./ISicleFactory.sol";

contract SwapOnFantom is Ownable {

    using SafeMath for uint256;
            
    IPancakeRouter02 _spiritRouter;
    IPancakeFactory _spiritFactory;
    ISicleRouter02 _sicleV2Router;
    ISicleFactory _sicleFactory;

    uint8 pauseContract = 0;
    address ManagerWallet;
    address spiritRouterAddress = 0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52;     //SpiritSwap address
    address spiritFactoryAddress = 0xEF45d134b73241eDa7703fa787148D9C9F4950b0;  
    address sicleRouterAddress = address(0);
    address sicleFactoryAddress = address(0);
    address nativeWrappedCurrencyAddr = 0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83;

    event Received(address, uint);
    event Fallback(address, uint);
    event SetContractStatus(address addr, uint256 pauseValue);
    event WithdrawAll(address addr, uint256 token, uint256 native);

    constructor() 
    {          
        _spiritRouter = IPancakeRouter02(spiritRouterAddress);   
        _spiritFactory = IPancakeFactory(spiritFactoryAddress);
        _sicleV2Router = ISicleRouter02(sicleRouterAddress);
        _sicleFactory = ISicleFactory(sicleFactoryAddress);
        ManagerWallet = address(0xe28f60670529EE8d14277730CDA405e24Ac7251A);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    fallback() external payable { 
        emit Fallback(msg.sender, msg.value);
    }
   
    function wherePairExists(address _Atoken, address _Btoken) public view returns(uint8 ){                
        if(sicleFactoryAddress != address(0) && 
            ( 
                _sicleFactory.getPair(_Atoken, _Btoken) != address(0) || 
                (_sicleFactory.getPair(_Atoken, nativeWrappedCurrencyAddr) != address(0) && _sicleFactory.getPair(nativeWrappedCurrencyAddr, _Btoken) != address(0))
            ) 
        )
        {
            return 1;
        }
        else if( _spiritFactory.getPair(_Atoken, _Btoken) != address(0) || 
            (_spiritFactory.getPair(_Atoken, nativeWrappedCurrencyAddr) != address(0) && _spiritFactory.getPair(nativeWrappedCurrencyAddr, _Btoken) != address(0)) )
        {
            return 2;
        } 
        else
        {
            return 0;
        }
    }

    function isSwapPathExists(address _Atoken, address _Btoken) public view returns(bool){        
        return (
            sicleFactoryAddress != address(0) && 
            ( 
                _sicleFactory.getPair(_Atoken, _Btoken) != address(0) || 
                (_sicleFactory.getPair(_Atoken, nativeWrappedCurrencyAddr) != address(0) && _sicleFactory.getPair(nativeWrappedCurrencyAddr, _Btoken) != address(0))
            ) 
        ) || 
        (
            _spiritFactory.getPair(_Atoken, _Btoken) != address(0) || 
            (_spiritFactory.getPair(_Atoken, nativeWrappedCurrencyAddr) != address(0) && _spiritFactory.getPair(nativeWrappedCurrencyAddr, _Btoken) != address(0))     
        );
    }

    function getContractStatus() external view returns (uint8) {
        return pauseContract;
    }

    function setContractStatus(uint8 _newPauseContract) external onlyOwner {
        pauseContract = _newPauseContract;
        emit SetContractStatus(msg.sender, _newPauseContract);
    }

    function setspiritRouterAddress(address _addr) public onlyOwner{
        require(pauseContract == 0, "Contract Paused");
        require(_addr != address(0), "Invalid address");
        spiritRouterAddress = _addr;
        _spiritRouter = IPancakeRouter02(spiritRouterAddress);   
    }

    function getspiritRouterAddress() public view returns(address){
        return spiritRouterAddress;
    }

    function setspiritFactoryAddress(address _addr) public onlyOwner{
        require(pauseContract == 0, "Contract Paused");
        require(_addr != address(0), "Invalid address");
        spiritFactoryAddress = _addr;
        _spiritFactory = IPancakeFactory(spiritFactoryAddress);
    }

    function getspiritFactoryAddress() public view returns(address){
        return spiritFactoryAddress;
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

    function setNativeWrappedCurrencyAddress(address _addr) public onlyOwner{
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
        if(whereToSwap == 2) _tokenAContract.approve(address(_spiritRouter), _amountIn);    
        
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
            _spiritRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                _realAmountIn,
                _realRequestedAmountOutMin,               
                path,
                address(msg.sender),
                block.timestamp
            );
        }
        _tokenAContract.transfer(ManagerWallet, _amountIn.sub(_realAmountIn));     
    }

    function swapExactETHForTokens(address _TokenAddress, uint256 _slippage) public payable{
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
            _spiritRouter.swapExactETHForTokensSupportingFeeOnTransferTokens{value: _realAmountIn}(                
                _realRequestedAmountOutMin,               
                path,
                address(msg.sender),
                block.timestamp
            );
        }
        payable(ManagerWallet).transfer(msg.value.sub(_realAmountIn));   
    }

    function swapExactTokenForETH(address _TokenAddress, uint256 _amountIn, uint256 _slippage) public {
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
        _tokenAContract.approve(address(_spiritRouter), _amountIn);    

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
            _spiritRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(   
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
        uint256[] memory amountOutMins = _spiritRouter.getAmountsOut(_amountIn, path);
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

