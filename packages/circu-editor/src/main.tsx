// import React from "react"
import * as ReactDOMClient from "react-dom/client"
import App from "./App"

import "./normalize.css"
import "./scrollbar.css"
import "@icon-park/react/styles/index.css"
import "./slate/components/Nodes/Block/Head/head.css"
import "./styles/index.css"
import "./editor.css"

document.body.setAttribute("arco-theme", "dark")

const container = document.getElementById("root")
if (!container) throw "Can't find root dom."

const root = ReactDOMClient.createRoot(container)

root.render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
)
