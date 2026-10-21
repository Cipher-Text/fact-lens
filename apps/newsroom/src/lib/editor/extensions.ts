import { mergeAttributes, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

/**
 * The editor's schema. It must offer exactly what the story body contract allows (the contract
 * lists it in `bodyNodeTypes` and `bodyMarkTypes`; a test compares them), so nothing the editor
 * can make is ever rejected at save, and nothing in a saved body is dropped when it is opened.
 * Free of React and the DOM, so tests can build the schema without a browser.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Links may point at web pages and mail addresses only, never at script or data URLs. */
export const isAllowedLink = (url: string) => url.length <= 2048 && /^(https?:\/\/|mailto:)/i.test(url.trim());

/**
 * An image is a reference to a media asset, never a URL; the picture is loaded from the media
 * library by id. The toolbar inserts one from the library picker.
 */
export const ImageReference = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: true,
  addAttributes() {
    return {
      mediaAssetId: {
        default: null,
        parseHTML: (el) => {
          const id = el.getAttribute('data-media-asset-id');
          return id && UUID.test(id) ? id : null;
        },
      },
      alt: { default: null, parseHTML: (el) => el.getAttribute('data-alt') },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-media-asset-id]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const id = String(node.attrs.mediaAssetId ?? '');
    const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt : '';
    return [
      'figure',
      mergeAttributes(HTMLAttributes, { 'data-media-asset-id': id, 'data-alt': alt || undefined, contenteditable: 'false', class: 'editor-image' }),
      // The picture comes through the newsroom proxy, so only a person who is signed in can load it.
      ['img', { src: UUID.test(id) ? `/api/media/${id}/file?variant=card` : '', alt, loading: 'lazy' }],
      ['figcaption', {}, alt ? `Alt text: ${alt}` : 'No alt text yet. Add it before review.'],
    ];
  },
});

export const editorExtensions = [
  StarterKit.configure({
    codeBlock: false,
    heading: { levels: [1, 2, 3, 4] },
    link: {
      openOnClick: false,
      autolink: false,
      linkOnPaste: true,
      defaultProtocol: 'https',
      protocols: ['mailto'],
      isAllowedUri: (url) => isAllowedLink(url),
      HTMLAttributes: { rel: 'noopener noreferrer nofollow' },
    },
  }),
  ImageReference,
];
