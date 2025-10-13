const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

app.use(express.static('public'))

let nextClientId = 1
let nextMsgId = 1
const clients = new Map()
const history = []
const receipts = new Map()

function broadcast(obj, except = null){
  const raw = JSON.stringify(obj)
  for(const [id, c] of clients){
    if(c.ws && c.ws.readyState === WebSocket.OPEN && c.ws !== except) c.ws.send(raw)
  }
}
function sendTo(ws, obj){ if(ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)) }
function currentUserList(){ return Array.from(clients.entries()).map(([id,c])=>({id,name:c.name||('User'+id)})) }

wss.on('connection', ws => {
  let id
  let name = null

  // Optional resume from client
  const resumeHandler = (raw) => {
    try {
      const data = JSON.parse(raw)
      if(data.type === 'resume' && data.id && !clients.has(data.id)){
        id = data.id
      }
    } catch(e){}
  }
  ws.once('message', resumeHandler)

  // Assign new ID if none
  setTimeout(() => {
    if(!id) id = String(nextClientId++)
    clients.set(id, { ws, name })

    sendTo(ws, {
      type: 'welcome',
      id,
      history,
      receipts: Array.from(receipts.entries()).map(([k,s])=>[k,Array.from(s)]),
      users: currentUserList()
    })

    broadcast({ type: 'join', id, name }, ws)

    ws.on('message', raw => {
      try{
        const data = JSON.parse(raw)
        const cl = clients.get(id)

        if(data.type === 'setName'){
          name = String(data.name || '').slice(0,64)
          if(cl) cl.name = name
          broadcast({ type:'users', users: currentUserList() })

        } else if((data.type === 'message' || data.type === 'private') && !cl.name){
          sendTo(ws,{type:'error', message:'Set a display name before sending messages.'})

        } else if(data.type === 'message'){
          const text = String(data.text || '').slice(0,1000)
          const msgId = String(nextMsgId++)
          const entry = { type:'message', msgId, from:id, fromName:name, text, ts: Date.now() }
          history.push(entry)
          if(history.length>500) history.shift()
          receipts.set(msgId,new Set([id]))
          broadcast({ type:'message', entry })
          broadcast({ type:'readReceipt', msgId, readers:Array.from(receipts.get(msgId)) })

        } else if(data.type === 'private'){
          const to = String(data.to)
          const target = clients.get(to)
          const text = String(data.text || '').slice(0,1000)
          if(target && target.ws && target.ws.readyState === WebSocket.OPEN){
            const msgId = String(nextMsgId++)
            const entry = { type:'private', msgId, from:id, fromName:name, to, text, ts: Date.now() }
            receipts.set(msgId,new Set([id]))
            sendTo(target.ws,{type:'private', entry})
            sendTo(ws,{type:'private', entry})
            broadcast({ type:'readReceipt', msgId, readers:Array.from(receipts.get(msgId)) })
          } else sendTo(ws,{type:'error', message:'target offline'})

        } else if(data.type === 'read'){
          const msgId = String(data.msgId)
          if(!receipts.has(msgId)) receipts.set(msgId,new Set())
          const s = receipts.get(msgId)
          s.add(id)
          receipts.set(msgId,s)
          broadcast({ type:'readReceipt', msgId, readers:Array.from(s) })
        }

      }catch(e){
        sendTo(ws,{type:'error', message:'bad payload'})
      }
    })

    ws.on('close', ()=>{
      clients.delete(id)
      broadcast({ type:'leave', id })
      broadcast({ type:'users', users: currentUserList() })
    })

  }, 50)
})

const PORT = process.env.PORT || 8080
server.listen(PORT, ()=>console.log('listening', PORT))
