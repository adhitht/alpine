import { useEffect, useState } from 'react';
import './App.css';
import { Avatar, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import io from 'socket.io-client';
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";

const socket = io.connect('http://localhost:4500')

const PersonCard = ({ color, name, lastmessage, onPress }) => {
  return <Paper onClick={onPress} elevation={2} style={{ display: 'flex', borderRadius: 15, paddingTop: 20, marginTop: 20, paddingBottom: 20, justifyContent: 'center', alignItems: 'center' }}>
    <Avatar sx={{ bgcolor: color, height: 60, width: 60, fontSize: 36 }}>
      {name.charAt(0).toUpperCase()}
    </Avatar>
    <div style={{ width: '70%', paddingLeft: 25, textAlign: 'start' }}>
      <div style={{ fontSize: '150%', fontWeight: 600 }}>{name}</div>
      <div style={{ color: grey }}>{lastmessage}</div>
    </div>
  </Paper>
}


function App() {
  const [userph, setuserph] = useState('')
  const [userdetails, setuserdetails] = useState({ name: "", color: "" })
  const [currentchat, setcurrentchat] = useState()
  const [chatmessages, setchatmessages] = useState([])
  const [chattext, setchattext] = useState('')
  const [chatlist, setchatlist] = useState({})
  const [openDialog, handleDisplay] = useState(false);
  const [openInitDialog, handleInitDisplay] = useState(false);
  const [newchatphone, setnewchatphone] = useState('')
  const [newchatname, setnewchatname] = useState('')


  const handleClose = () => {
    handleDisplay(false);
  };

  const openDialogBox = () => {
    handleDisplay(true);
  };


  useEffect(() => {
    if (currentchat) {
      setchatlist(chatll => ({ ...chatll, [currentchat.id]: { name: currentchat.name, messages: chatmessages, color: currentchat.color } }))
    }
  }, [chatmessages])

  useEffect(() => {
    socket.on('connected', () => { console.log('socket connected') })
    if (localStorage.getItem('phonenumber')) {
      socket.emit('setup', localStorage.getItem('phonenumber'))
    }
  }, [])

  useEffect(() => {
    socket.on('recieve_message', (data) => {
      if (data.room.toString() === currentchat.id.toString()) {
        setchatmessages(messages => [...messages, { phonenumber: data.phonenumber, message: data.message }])
      }
    }
    )
    socket.on('requested_chat', (data) => {
      const id = data.phonenumber < data.newchatphone ? data.phonenumber + data.newchatphone : data.newchatphone + data.phonenumber
      if (!Object.keys(chatlist).includes(id)) {
        setchatlist(chatll => ({ ...chatll, [id]: { name: data.userdetails.name, messages: [], color: data.userdetails.color } }))
      }
    })
    return () => { socket.off('recieve_message').off(); socket.emit('end') }
  }, [socket, currentchat])

  useEffect(() => {
    if (localStorage.getItem('chatlist')) {
      setchatlist(JSON.parse(localStorage.getItem('chatlist')))
    }
    if (localStorage.getItem('phonenumber')) {
      setuserph(localStorage.getItem('phonenumber'))
    }
    else {
      handleInitDisplay(true)
    }
    if (localStorage.getItem('userdetails') && Object.values(JSON.parse(localStorage.getItem('userdetails'))).filter(value => { return value != '' }).length) {
      setuserdetails(JSON.parse(localStorage.getItem('userdetails')))
    } else {
      handleInitDisplay(true)
    }
  }, [])

  useEffect(() => {
    if (Object.keys(chatlist).length !== 0) {
      localStorage.setItem('chatlist', JSON.stringify(chatlist));
    }
    if (document.getElementById('chatlists').lastElementChild) {
      document.getElementById('chatlists').lastElementChild.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatlist]);

  useEffect(() => {
    if (Object.values(userdetails).filter(value => { return value != '' }).length < 2) {
      console.log("Userdetails is empty")
    } else {
      localStorage.setItem('userdetails', JSON.stringify(userdetails))
      handleInitDisplay(false)
    }
  }, [userdetails])


  const sendmessage = () => {
    setchatmessages(messages => [...messages, { phonenumber: userph.toString(), message: chattext }])
    socket.emit("new_message", { room: currentchat.id, message: chattext, phonenumber: userph.toString() })
    setchattext('')
  }

  const newchat = () => {
    const id = newchatphone < userph.toString() ? newchatphone + userph.toString() : userph.toString() + newchatphone
    const colors = ['orange', 'rubyred', 'pink', 'green', 'blue']
    if (!Object.keys(chatlist).includes(id)) {
      setchatlist(chatll => ({ ...chatll, [id]: { name: newchatname, messages: [], color: colors[Math.floor(Math.random() * colors.length)] } }))
    }
    socket.emit("request_new_chat", { newchatphone: newchatphone, userdetails: userdetails, phonenumber: userph.toString() })
    setnewchatphone('')
    setnewchatname('')
    handleClose()
  }

  const registeruser = () => {
    const colors = ['orange', 'rubyred', 'pink', 'green', 'blue']
    setuserdetails({ ...userdetails, color: colors[Math.floor(Math.random() * colors.length)] })
    if (userph) {
      localStorage.setItem('phonenumber', userph)
      socket.emit('setup', userph)
    }
  }

  const PersonClick = ({ chatlist, key }) => {
    if (!currentchat || currentchat.id != key) {
      setcurrentchat({ name: chatlist[key].name, color: chatlist[key].color, id: key });
      socket.emit('setup', key)
      if (chatlist[key].messages) {
        setchatmessages(chatlist[key].messages)
      } else {
        setchatmessages([])
      }
    }
  }

  const ChatMessage = ({ phonenumber, message }) => {
    return phonenumber == userph ?
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignSelf: 'flex-end', margin: '3px 30px', fontSize: 20, width: '45%', textAlign: 'start' }}>
        <span style={{ padding: 15, color: 'white', background: 'dodgerblue', borderRadius: '10px 10px 0 10px' }}>
          {message}
        </span>
      </div>
      :
      <div style={{ margin: '15px 30px', fontSize: 20, width: '45%', textAlign: 'start' }}>
        <span style={{ padding: 15, background: 'lightgrey', borderRadius: '10px 10px 10px 0' }}>
          {message}
        </span>
      </div>
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/*  Dialog for New chat */}
      <Dialog onClose={handleClose} open={openDialog} style={{ padding: 10 }}>
        <DialogTitle> New Chat</DialogTitle>
        <div style={{ fontSize: 25, position: 'absolute', right: 15, top: 15, userSelect: 'none', }} onClick={handleClose}>X</div>
        <div style={{ margin: 20 }}>
          <div>Enter mobile number of new chat</div>
          <br />
          <div>
            <input style={{ height: 30, fontSize: 24, paddingLeft: 10, borderRadius: 7 }} placeholder='Name' value={newchatname} onChange={(e) => { setnewchatname(e.target.value) }} />
            <input style={{ height: 30, fontSize: 24, paddingLeft: 10, borderRadius: 7 }} placeholder='Phone' value={newchatphone} onChange={(e) => { setnewchatphone(e.target.value) }} />
            <button style={{ height: 35, marginLeft: 15, }} onClick={() => { newchat() }}>Chat</button>
          </div>
        </div>
      </Dialog>

      {/* Dialog for new user */}
      <Dialog onClose={() => { handleInitDisplay(false) }} open={openInitDialog} style={{ padding: 10 }}>
        <DialogTitle> Welcome to Alpine </DialogTitle>
        <div style={{ fontSize: 25, position: 'absolute', right: 15, top: 15, userSelect: 'none', }} onClick={() => { handleInitDisplay(false) }}>X</div>
        <div style={{ margin: 20 }}>
          <div>Enter Your Name</div>
          <br />
          <input style={{ height: 30, fontSize: 24, paddingLeft: 10, borderRadius: 7 }} value={userdetails.name} onChange={(e) => { setuserdetails({ ...userdetails, name: e.target.value }) }} />
          <div>Enter Your Phone Number</div>
          <input style={{ height: 30, fontSize: 24, paddingLeft: 10, borderRadius: 7 }} value={userph} onChange={(e) => { setuserph(e.target.value) }} />
          <button style={{ height: 35, marginLeft: 15, }} onClick={registeruser}>Save</button>
        </div>
      </Dialog>

      {/* Side Pane. List of all chats */}
      <div style={{ width: '30%', height: "100%" }}>
        <div>
          <div style={{ textAlign: 'start', fontWeight: 800, fontSize: 60 }}>
            Alpine
          </div>
          <br />
          <div style={{ display: 'flex' }}>
            <input className='input' />
            <button style={{ marginLeft: 25, width: '22%' }} onClick={openDialogBox}>New Chat</button>
          </div>
        </div>
        <br />
        <div style={{ overflowY: 'scroll', height: "calc(100% - 200px)" }}>
          {Object.keys(chatlist).length > 0 && Object.keys(chatlist).map((key) => {
            return <PersonCard key={key} name={chatlist[key].name} color={chatlist[key].color} onPress={() => { PersonClick({ chatlist, key }) }} />
          })}
        </div>
      </div>

      {/* Main Area. Chats and send button */}
      <div style={{ width: '70%' }}>
        <Paper elevation={2} style={{ paddingLeft: 50, paddingTop: 25, paddingBottom: 25, fontSize: '150%', textAlign: 'start' }}>
          {currentchat ? currentchat.name : 'Chat'}
        </Paper>
        <div id="chatlists" style={{ display: 'flex', flexDirection: 'column', width: 'calc(100% - 50px)', height: 'calc(100% - 150px)', overflowY: 'scroll', paddingRight: 20 }}>
          {chatmessages && chatmessages.map(message => { return <ChatMessage phonenumber={message.phonenumber} message={message.message} /> })}
        </div>
        <div>
          <input style={{ width: 'calc(100% - 200px)', height: 40, fontSize: 24, paddingLeft: 10, borderRadius: 7 }} value={chattext} onChange={(e) => { setchattext(e.target.value) }} />
          <button style={{ height: 45, paddingLeft: 20, paddingRight: 20 }} onClick={sendmessage}>Send</button>
        </div>
      </div>
    </div>
  )
}

export default App
