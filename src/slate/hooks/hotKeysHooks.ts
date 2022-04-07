import type React from "react"
import { Editor, Transforms } from "slate"
import { useSlate } from "slate-react"
import { toggleMark } from "../components/Nodes/Text/textHelper"
import { SlateElement, SlateNode, SlateRange } from "../types/slate"

const leftRightHandler = (event: React.KeyboardEvent, editor: Editor) => {
  const { code } = event

  if (code === "ArrowLeft") {
    event.preventDefault()
    Transforms.move(editor, { unit: "offset", reverse: true })
    return
  }
  if (code === "ArrowRight") {
    event.preventDefault()
    Transforms.move(editor, { unit: "offset" })
    return
  }
}

export const useOnKeyDown = () => {
  const editor = useSlate()
  const { selection } = editor

  const onKeyDown: React.KeyboardEventHandler = (event) => {
    if (selection && SlateRange.isCollapsed(selection)) {
      leftRightHandler(event, editor)
    }

    // for debug and develop
    if (event.altKey && event.key === "q") {
      console.log(editor.selection?.anchor)
    }
    if (event.altKey && event.key === "w") {
      if (editor.selection) {
        const selectedNodes = Array.from(
          Editor.nodes(editor, {
            match: (n) => SlateElement.isElement(n),
          })
        ).map((item) => item[0])
        console.log(selectedNodes)
      }
    }
  }

  return onKeyDown
}
