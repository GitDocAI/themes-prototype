import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CardNodeView } from '../node-views/CardNodeView'

export const CardBlock = Node.create({
  name: 'cardBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      title: {
        default: '',
      },
      icon: {
        default: '',
      },
      iconAlign: {
        default: 'left',
      },
      href: {
        default: '',
      },
      content: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="card-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'card-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CardNodeView)
  },

  addCommands() {
    return {
      setCardBlock:
        (attributes: any) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `card-${Date.now()}`,
              ...attributes,
            },
          })
        },
    } as any
  },
})
