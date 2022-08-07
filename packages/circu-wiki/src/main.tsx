// import React from 'react'
import * as ReactDOMClient from "react-dom/client"
import App from "./App"

import "./normalize.css"
import "./scrollbar.css"
import "./index.css"
import "react-loading-skeleton/dist/skeleton.css"

const container = document.getElementById("root")
if (!container) throw "Can't find root dom."

const root = ReactDOMClient.createRoot(container)

root.render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
)
