import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import SearchBar from "material-ui-search-bar";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { DataGrid, enUS } from "@material-ui/data-grid";
import { Avatar, Alert, Snackbar} from '@mui/material';
import { makeStyles } from "@material-ui/core/styles";

function Github() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      <Link color="inherit" href="https://github.com/marianhoenscheid">
        Follow me on Github
      </Link>
    </Typography>
  );
}



const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
  },
});
const axios = require('axios');


const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.secondary.main
  }
}));


export default function Queue() {
  useEffect(() => {
    search("")
  }, [theme]);

  const classes = useStyles();
  const columns = [
    { field: "cover", headerName: "", width: 40, renderCell: (params) => <Avatar variant="rounded" src={rows[params.row.id].cover}></Avatar> },      
    { field: "song", headerName: "", flex: 1000, renderCell: (params) => <Box><Typography mt={0}>{rows[params.row.id].song} </Typography><Typography variant="body2" mt={0}>{rows[params.row.id].artist} &#8226; {rows[params.row.id].album} &#8226; {rows[params.row.id].duration}</Typography></Box>},
    { field: "artist", headerName: "", width: 0, hide: true },
    { field: "album", headerName: "", width: 0, hide: true }, 
    { field: "duration", headerName: "", width: 0, hide: true },
    { field: "uri", headerName: "", width: 0, hide: true }
  ];
  const [rows, setRows] = React.useState([]);
  const [selectedSong, setSelectedSong] = React.useState({});
  const [alert, setAlert] = React.useState("success");
  const [msg, setMsg] = React.useState("");
  var searchValue = ""
  function search(value) {
    axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
    axios.post('/api/search', {
      q: value
    },
    {"Access-Control-Allow-Origin": "*"}
    )
    .then(function (response) {
      var data = response.data;
      var newRows = [];
      if (JSON.stringify(data) == "{}"){ 
        axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
        axios.get('/api/np')
        .then(function (response) {
          var data = response.data;
          var newRows = [];
          data.results.forEach((result, index) => {
            newRows.push({
              id: index,
              cover: result.cover,
              song: "Now Playing: " + result.song,
              artist: result.artist,
              album: result.album,
              duration: result.duration,
              uri: result.uri
            })
          })
          setRows(newRows)
        }).catch(function (error) {
          console.log(error);
        });
      }else{
        data.results.forEach((result, index) => {
          newRows.push({
            id: index,
            cover: result.cover,
            song: result.song,
            artist: result.artist,
            album: result.album,
            duration: result.duration,
            uri: result.uri
          })
        })
        setRows(newRows)
      }
    })
    .catch(function (error) {
      console.log(error);
    });
  }
  function askUser(nSong, nArtist, nUri) {
    if (!nSong.startsWith("Now Playing:")){
      var nextSong = {
        song: nSong,
        artist: nArtist,
        uri: nUri
      }
        setSelectedSong(nextSong);
        dialogeSetOpen(true);
    }
  }
  function addToQueue(value) {
    axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
    axios.post('/api/queue', {
      uri: value
    },
    {"Access-Control-Allow-Origin": "*"}
    )
    .then(function (response) {
      setAlert(response.data.alert);
      setMsg(response.data.msg);
      snackSetOpen(true);
    })
    .catch(function (error) {
      console.log(error);
    });
  }
  const [snackOpen, snackSetOpen] = React.useState(false);
  const [dialogeOpen, dialogeSetOpen] = React.useState(false);

  const snackHandleClose = () => {
    snackSetOpen(false);
  };

  const dialogeHandleCloseYes = () => {
    addToQueue(selectedSong.uri)
    var nextSong = {
      song: "",
      artist: "",
      uri: ""
    }
    setSelectedSong(nextSong);
    dialogeSetOpen(false);
  };
  const dialogeHandleCloseNo = () => {
    var nextSong = {
      song: "",
      artist: "",
      uri: ""
    }
    setSelectedSong(nextSong);
    dialogeSetOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="relative">
        <Toolbar>
          <Typography variant="h6" color="inherit" noWrap>
            Spotify Queue
          </Typography>
        </Toolbar>
      </AppBar>
      <main>
        <Box
          sx={{
            bgcolor: 'background.paper',
            pt: 8,
            pb: 6,
          }}
        >
          <Container>
              <SearchBar
                value={searchValue}
                placeholder="Search"
                onChange={(newValue) => search(newValue)} 
              />
          </Container>
        </Box>
        <Container>
        <Box >
          <Grid>
            <DataGrid
                disableColumnMenu={true}
                disableSelectionOnClick={true}
                autoPageSize={true}
                localeText={enUS.props.MuiDataGrid.localeText}
                onRowClick={(params) => askUser(rows[params.row.id].song,rows[params.row.id].artist,rows[params.row.id].uri)}
                autoHeight={true}
                headerHeight={0}
                rows={rows}
                columns={columns}
                hideFooter={true}
            />
          </Grid>
        </Box>
        </Container>
        <Dialog
        fullScreen={false}
        open={dialogeOpen}
        onClose={dialogeHandleCloseNo}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          {"Add Song?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to add {selectedSong.song} by {selectedSong.artist} to the Queue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={dialogeHandleCloseNo}>
            No
          </Button>
          <Button onClick={dialogeHandleCloseYes} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
        <Snackbar open={snackOpen} autoHideDuration={6000} onClose={snackHandleClose}>
          <Alert onClose={snackHandleClose} severity={alert} sx={{ width: '100%' }}>
            {msg}
          </Alert>
        </Snackbar>
      </main>
      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
        <Github />
      </Box>
      {/* End footer */}
    </ThemeProvider>
  );
}
