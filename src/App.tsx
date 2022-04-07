import { useState } from "react"
import type { Descendant } from "slate"
import { Slate } from "slate-react"
import { doc, docContainer } from "./App.css"
import ToolBar from "./slate/components/ToolBar/ToolBar"
import { useCreateEditor } from "./slate/hooks/useCreateEditor"
import SlateEditable from "./slate/SlateEditable"

//TODO-BUG: 行内样式光标移不出来?
//TODO: 用 useSlateStatic 替代 useSlate 减少重渲染
const App: React.FC = () => {
  const editor = useCreateEditor()
  const [value, setValue] = useState<Descendant[]>([
    {
      type: "paragraph",
      children: [
        {
          text: "A line of text in a paragraph. - 1",
        },
      ],
    },
    {
      type: "blockCode",
      children: [
        {
          type: "blockCode_voidArea",
          children: [
            {
              text: "",
            },
          ],
        },
        {
          type: "blockCode_codeArea",
          langKey: "Javascript",
          children: [
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "const tmp = 1",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "const foo = 2",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "console.log(tmp + foo)",
                },
              ],
            },
          ],
        },
        {
          type: "blockCode_voidArea",
          children: [
            {
              text: "",
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      children: [
        {
          text: "A line of text in a paragraph. - 2",
        },
      ],
    },
    {
      type: "blockCode",
      children: [
        {
          type: "blockCode_voidArea",
          children: [
            {
              text: "",
            },
          ],
        },
        {
          type: "blockCode_codeArea",
          langKey: "PlainText",
          children: [
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "blockCode with PlainText",
                },
              ],
            },
          ],
        },
        {
          type: "blockCode_voidArea",
          children: [
            {
              text: "",
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      children: [
        {
          text: "A line of text in a paragraph. - 3",
        },
      ],
    },
    {
      type: "blockCode",
      children: [
        {
          type: "blockCode_voidArea",
          children: [
            {
              text: "",
            },
          ],
        },
        {
          type: "blockCode_codeArea",
          langKey: "Javascript",
          children: [
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: 'import React from "react"',
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: 'import * as ReactDOMClient from "react-dom/client"',
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: 'import App from "./App"',
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: 'import "./normalize.css"',
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: 'document.body.setAttribute("arco-theme", "dark")',
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: 'const container = document.getElementById("root")',
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: 'if (!container) throw "Can\'t find root dom."',
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "const root = ReactDOMClient.createRoot(container)",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "root.render(",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "  <React.StrictMode>",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "    <App />",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: "  </React.StrictMode>",
                },
              ],
            },
            {
              type: "blockCode_codeLine",
              children: [
                {
                  text: ")",
                },
              ],
            },
          ],
        },
        {
          type: "blockCode_voidArea",
          children: [
            {
              text: "",
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      children: [
        {
          text: "",
        },
      ],
    },
  ])

  return (
    <div className={docContainer}>
      <div className={doc}>
        <Slate editor={editor} value={value} onChange={(newValue) => setValue(newValue)}>
          <SlateEditable></SlateEditable>
          <ToolBar></ToolBar>
        </Slate>
      </div>
    </div>
  )
}

export default App
