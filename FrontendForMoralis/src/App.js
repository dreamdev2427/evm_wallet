import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { lighten, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import 'react-notifications/lib/notifications.css';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import axios from "axios";
import Modal from '@material-ui/core/Modal';

import { backendURL } from './config';

const headCells = [
  { id: 'Email', numeric: true, disablePadding: false, label: 'Email' },
  { id: 'API Key', numeric: true, disablePadding: false, label: 'API key' },
];

function EnhancedTableHead(props) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount } = props;
  
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all desserts' }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
              {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const useToolbarStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  title: {
    flex: '1 1 100%',
  },
}));

const EnhancedTableToolbar = (props) => {
  const classes = useToolbarStyles();
  const { numSelected, onClickDelete, onClickAdd } = props;

  return (
    <Toolbar
      className={clsx(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
    >
      {numSelected > 0 ? (
        <Typography className={classes.title} color="inherit" variant="subtitle1" component="div">
          {numSelected} selected
        </Typography>
      ) : (
        <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
          Add or delete keys
        </Typography>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton aria-label="delete" onClick={() => { onClickDelete() }} >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Add a key">
          <IconButton aria-label="add a Moralis API key" onClick={() => { onClickAdd() }} >
            <AddIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onClickDelete: PropTypes.func.isRequired,
  onClickAdd: PropTypes.func.isRequired
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    display:"flex",
    flexDirection:"column",
    alignItems:"center"
  },
  paper: {
    width: '80%',
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 750,
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
  modalContaner: {
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    display:"flex",
    flexDirection:"column",
    justifyContent:"center"
  },
  modalContanerItems: {
    marginTop: 20
  }
}));

export default function App() {
  const classes = useStyles();
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('calories');
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rows, setRows] = useState([]); 
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [newEmail, setNewEmail] = useState("");
  const [newKey, setNewKey] = useState("");

  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function getModalStyle() {
    const top = 50;
    const left = 50;

    return {
      top: `${top}%`,
      left: `${left}%`,
      transform: `translate(-${top}%, -${left}%)`,
    };
  }

  const modalbody = (
    <div className={classes.modalContaner}>
      <TextField id="standard-email" label="Email" onChange={(e) => setNewEmail(e.target.value)} value={newEmail} />
      <TextField id="standard-key" className={classes.modalContanerItems} label="Key" onChange={(e) => setNewKey(e.target.value)} value={newKey} />
      <Button variant="contained" className={classes.modalContanerItems} onClick={() => {onUploadNewKey()}}>Add</Button>
    </div>
  );

  const onUploadNewKey = async () => {
    console.log("onUploadNewKey() 00")
    if(newEmail !== "" && newKey !== "")
    {
      await axios({
        method: "post",
        url: `${backendURL}/api/moralisApiKeys/set`,
        data: {
          email: newEmail,
          apiKey: newKey
         }
        }).then((res)=>{
            if(res.data && res.data.code === 0)
            { 
              handleClose();
              initailizeTable();
            }
        }).catch((err)=> {
            console.error(err);    
        });
    }else{
      NotificationManager.warning("Please input valid email and key.");
    }
  }

  const initailizeTable = async() => {
    await axios({
      method: "post",
      url: `${backendURL}/api/moralisApiKeys/all`,
      data: { }
      }).then((res)=>{
          if(res.data && res.data.code === 0)
          {
            let tempRows = [];
            let dataFromDB = res.data?.data;
            let newRow = {};
            for(let idx=0; idx<dataFromDB.length; idx++)
            {
              newRow = { idOnDB:dataFromDB[idx]._id, email:dataFromDB[idx].email, key:dataFromDB[idx].apiKey }
              tempRows.push(newRow);
            }
            setRows(tempRows);
          }
      }).catch((err)=> {
          console.error(err);    
      });
  }

  useEffect(() => {    
    initailizeTable();
  },[]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n.email);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

  const handleDelete = async () => {
    console.log(selected);
    await axios({
      method: "post",
      url: `${backendURL}/api/moralisApiKeys/delete`,
      data: {
        idArray: selected
       }
      }).then((res)=>{
          if(res.data && res.data.code === 0)
          {
            setSelected([]);
          }
      }).catch((err)=> {
          console.error(err);    
      });
    
    initailizeTable();
  }

  return (
    <div className={classes.root}>
      <h2 style={{ margin:"100px", textAlign:"center" }} >Moralis API keys</h2>
      <Paper className={classes.paper}  >
        <EnhancedTableToolbar numSelected={selected.length} onClickDelete={handleDelete} onClickAdd={handleOpen}/>
        <TableContainer>
          <Table
            className={classes.table}
            aria-labelledby="tableTitle"
            aria-label="enhanced table"
          >
            <EnhancedTableHead
              classes={classes}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody>
              {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row?.idOnDB);
                  const labelId = row?.idOnDB;

                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, row?.idOnDB)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.email+index}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </TableCell>
                      <TableCell component="th" id={labelId} scope="row" padding="none">
                        {row.email}
                      </TableCell>
                      <TableCell align="right">{row.key}</TableCell>
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
          style={{ display: "flex", justifyContent:"center", alignItems:"center" }}  
        >
          {modalbody}
        </Modal>
      </Paper>    
      <NotificationContainer/>
    </div>
  );
}
