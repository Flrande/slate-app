import { useAtomValue } from "jotai"
import { Editor } from "slate"
import { useSlateStatic } from "slate-react"
import { BLOCK_ELEMENTS_WITH_CHILDREN } from "../../types/constant"
import type { BlockElementWithChildren } from "../../types/interface"
import { SlateElement } from "../../types/slate"
import { arrayIncludes } from "../../utils/general"
import { FoldButtonSvg } from "./FoldButton.css"
import { toggleFold, unToggleFold } from "./foldHelper"
import { foldStateAtom } from "./state"

const FoldButton: React.FC = () => {
  //TODO: 这里可能需要用 useSlate, 因为某些情况下节点的折叠状态会突变
  const editor = useSlateStatic()
  const foldState = useAtomValue(foldStateAtom)

  if (foldState) {
    try {
      const path = foldState.path
      const [node] = Editor.node(editor, path)

      if (SlateElement.isElement(node) && arrayIncludes(BLOCK_ELEMENTS_WITH_CHILDREN, node.type)) {
        const element = node as BlockElementWithChildren

        if (element.type === "head" || element.children.length > 1) {
          const onClick: React.MouseEventHandler = () => {
            if (element.isFolded) {
              unToggleFold(editor, path)
            } else {
              toggleFold(editor, path)
            }
          }

          return (
            <div
              style={{
                position: "absolute",
                left: `${foldState.left}px`,
                top: `${foldState.top}px`,
              }}
            >
              <div contentEditable={false} onClick={onClick}>
                <svg
                  style={{
                    transform: element.isFolded ? "rotate(-0.25turn)" : undefined,
                  }}
                  className={FoldButtonSvg}
                  width="16"
                  height="16"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M36 19L24 31L12 19H36Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinejoin="bevel"
                  />
                </svg>
              </div>
            </div>
          )
        }
      }
    } catch (error) {}
  }

  return <div></div>
}

export default FoldButton