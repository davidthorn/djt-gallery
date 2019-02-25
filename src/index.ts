enum GalleryKeys {
    id = "gallery-id",
    image = "images",
    gallery = "gallery",
    buttons = "[gallery-ref]",
    ref = "gallery-ref",
    leftArrowClassName = 'left-arrow',
    curtainSelector = '.gallery-curtain'
}

interface ElementConfig {
    hidden?: boolean
    tag: 'div' | 'img' | 'span'
    className?: string
    id?: string
    attributes?: { [key: string]: string }
    children?: ElementConfig[]
    onClick?: (event: Event, refs: { [key: string]: any }) => void
    onAdded?: (element: Element, refs: { [key: string]: any }) => void
    ref?: string
    refs?: { [key: string]: any }
    [key: string]: any
    element?: Element
    content?: string
}
interface GalleryDimensions {
    width: number
    height: number
}
interface GalleryElement {
    id: string
    imageUrls: string[]
    active: boolean
    dimensions: GalleryDimensions
    element: Element
    index: number
    next(): string | undefined
    prev(): string | undefined
    hasNextImage(): boolean
    hasActiveImage(): boolean 
    hasImage(index: number) : boolean
}

interface GalleryButton {
    gallery: GalleryElement
    element: Element
}

class Gallery implements GalleryElement {

    id: string
    imageUrls: string[] = []
    active: boolean
    dimensions: GalleryDimensions
    element: Element
    index: number = 0
   
    next(): string | undefined {
        if (this.hasNextImage()) {
            this.index += 1
            return this.imageUrls[this.index]
        }
        return undefined

    }
    prev(): string | undefined {
        if (this.hasPreviousImage()) {
            this.index -= 1
            return this.imageUrls[this.index]
        }
        return undefined
    }

    hasNextImage(): boolean {
        return this.hasImage(this.index + 1)
    }

    hasPreviousImage(): boolean {
        return this.hasImage(this.index - 1)
    }

    hasActiveImage(): boolean {
        return this.hasImage(this.index)
    }

    hasImage(index: number): boolean {
        if(index < 0) return false
        return index <= this.imageUrls.length - 1
    }

    constructor(element: Element, imageUrls: string[] , id: string) {
        this.dimensions = element.getBoundingClientRect()
        this.id = id
        this.active = false
        this.imageUrls = imageUrls
        this.element = element
    }

}

const createGalleryElement = (config: ElementConfig, parent?: Element | Document | HTMLElement | undefined): Element => {
    const { id, className, attributes, children, onClick, onAdded, ref, refs, content } = config
    if (refs === undefined) {
        config.refs = {}
    }

    const element = document.createElement(config.tag)
    if (parent !== undefined) {
        parent.appendChild(element)
    }

    config.element = element
    if (ref !== undefined) {
        config[ref] = config
    }

    if (id !== undefined) {
        element.setAttribute('id', id)
    }

    if (className !== undefined) {
        element.className += className
    }

    if (attributes !== undefined) {
        Object.keys(attributes).forEach(key => {
            const attr = attributes[key]
            element.setAttribute(key, attr)
        })
    }

    if (children !== undefined) {
        children.forEach(child => {
            if (child.ref !== undefined) {
                config.refs![child.ref] = child
                config[child.ref] = child
                child.refs = config.refs
            }
            createGalleryElement(child, element)
        })
    }

    if (onClick !== undefined) {
        const cb = onClick.bind(config)
        element.addEventListener('click', function (e) {
            cb(e, config.refs!)
        })
    }

    if (onAdded !== undefined) {
        const cb = onAdded.bind(config)
        cb(element, config.refs!)
    }

    if (content !== undefined) {
        element.innerHTML = content
    }

    return element
}

/**
 * Creates a string containing only random upper and lower case letters
 *
 * @param {number} length
 * @returns {string}
 */
const uuid = (length: number): string => {
    const items = [...Array(length).keys()]
    return items.map(i => {
        const char = Math.floor(Math.random() * 26)
        const sin = Math.random() < 0.5
        const code = sin === true ? 97 : 65
        return String.fromCharCode(char + code)
    }).join('')
}

/**
 * Converts a NodeListOf<Element> to a standard array
 *
 * @param {NodeListOf<Element>} list
 * @returns {Element[]}
 */
const elements = (list: NodeListOf<Element>): Element[] => {
    let items: Element[] = []
    list.forEach(i => [
        items.push(i)
    ])
    return items
}

/**
 * Retrieves all images urls from the images attribute of this element
 * Returns an empty array is the attribute is not found
 *
 * @param {Element} element
 * @returns {string[]}
 */
const getImageUrls = (element: Element): string[] => {
    return elements(element.querySelectorAll('url')).map(i => {
        return i.getAttribute('source')
    }).filter(i => { return i !== null }).map(i => i!)
}

/**
 * Convert this element to a GalleryElement object
 *
 * @param {Element} element
 * @returns {GalleryElement}
 */
const convertElement = (element: Element): GalleryElement => {
    if (element.getAttribute(GalleryKeys.id) === null) {
        element.setAttribute(GalleryKeys.id, uuid(10))
    }
    element.setAttribute('style', 'display: none')
    return new Gallery(element , getImageUrls(element) ,element.getAttribute(GalleryKeys.id)! )
}

/**
 * Returns all GalleryElem
 *
 * @returns {GalleryElement[]}
 */
const getGalleries = (): GalleryElement[] => {
    const galleryElements = document.querySelectorAll(GalleryKeys.gallery)
    const galleryAttrElements = document.querySelectorAll(`[${GalleryKeys.gallery}]`)
    const galleries = elements(galleryElements).map(convertElement)
    return galleries.concat(elements(galleryAttrElements).map(convertElement))
}

/**
 *
 *
 * @returns {GalleryButton[]}
 */
const getGalleryButtons = (): GalleryButton[] => {
    const galleryButtonElements = document.querySelectorAll(GalleryKeys.buttons)
    return elements(galleryButtonElements).map(convertButtonElement).filter(i => { return i !== undefined }).map(i => i!)
}

/**
 *
 *
 * @param {string} id
 * @returns {(GalleryElement | undefined)}
 */
const getGallery = (id: string): GalleryElement | undefined => {
    const galleryElements = getGalleries().filter(i => { return i.id === id })
    return galleryElements.length > 0 ? galleryElements[0] : undefined
}

/**
 *
 *
 * @param {Element} element
 * @returns {(GalleryButton | undefined)}
 */
const convertButtonElement = (element: Element): GalleryButton | undefined => {
    const id = element.getAttribute(GalleryKeys.ref)
    if (id === null) return undefined
    const gallery = getGallery(id)
    if (gallery === undefined) return undefined
    element.addEventListener('click', (e) => {
        showGallery(gallery)
    })
    return {
        element,
        gallery
    }
}

/**
 *
 *
 * @param {GalleryElement} gallery
 * @param {boolean} active
 * @param {number} index
 * @returns {ElementConfig}
 */
const GalleryImage: (gallery: GalleryElement, active: boolean, index: number) => ElementConfig = function (gallery: GalleryElement, active: boolean, index: number): ElementConfig {
    return {
        ref: active == true ? 'activeImage' : 'nextImage',
        tag: 'img',
        className: `gallery-image-${active ? 'active' : 'next'} ${active ? 'fade-in' : 'fade-out'}`,
        attributes: {
            index: index.toString()
        },
        onAdded: function (imageElement, refs) {
            const elem = imageElement as HTMLImageElement
            const index = parseInt(imageElement.getAttribute('index')!)
            console.log(gallery.imageUrls[index])
            const imageUrl = gallery.imageUrls[index]
            loadGalleryImage(imageUrl , elem , refs , gallery)
        }
    }
}

/**
 *
 *
 * @param {GalleryElement} gallery
 * @returns {ElementConfig}
 */
const ActiveImage: (gallery: GalleryElement) => ElementConfig = function (gallery: GalleryElement): ElementConfig {
    return GalleryImage(gallery, true, 0)
}

/**
 *
 *
 * @param {GalleryElement} gallery
 * @param {(refs: { [key:string] : any }) => HTMLImageElement} imageElement
 * @returns {ElementConfig}
 */
const PreviousImageButton: (gallery: GalleryElement, imageElement: (refs: { [key:string] : any }) => HTMLImageElement) => ElementConfig = function (gallery: GalleryElement, imageElement:  (refs: { [key:string] : any }) => HTMLImageElement): ElementConfig {
    return {
        ref: 'leftButton',
        tag: 'div',
        className: 'gallery-left-button',
        onClick: (event, refs) => {
            loadGalleryImage(gallery.prev(), imageElement(refs), refs, gallery);
        },
        onAdded: (element) => {
            element.setAttribute('style', 'display: none')
        },
        children: [
            {
                tag: 'span',
                className: 'left-arrow',
                content: '<'
            }
        ]
    }
}

/**
 *
 *
 * @param {GalleryElement} gallery
 * @param {(refs: { [key:string] : any }) => HTMLImageElement} imageElement
 * @returns {ElementConfig}
 */
const NextImageButton: (gallery: GalleryElement, imageElement: (refs: { [key:string] : any }) => HTMLImageElement) => ElementConfig = function (gallery: GalleryElement, imageElement: (refs: { [key:string] : any }) => HTMLImageElement): ElementConfig {
    return {
        ref: 'rightButton',
        tag: 'div',
        className: 'gallery-right-button',
        onClick: (event, refs) => {
            loadGalleryImage(gallery.next(), imageElement(refs), refs, gallery);
        },
        onAdded: (element) => {
            if(!gallery.hasNextImage()) {
                element.setAttribute('style', 'display: none')
            } 
        },
        children: [
            {
                tag: 'span',
                className: 'left-arrow',
                content: '>'
            }
        ]
    }
}

/**
 *
 *
 * @param {GalleryElement} gallery
 * @returns {ElementConfig}
 */
const CloseButton: (gallery: GalleryElement) => ElementConfig = function (gallery: GalleryElement): ElementConfig {
    return {
        ref: 'closeButton',
        tag: 'div',
        className: 'gallery-close-button',
        onClick: function () {
            document.querySelectorAll(GalleryKeys.curtainSelector).forEach(i => {
                i.className = `${i.className} fade-out`
                setTimeout(() => {
                    gallery.index = 0
                    i.remove()
                }, 1000)
            })
        },
        children: [
            {
                tag: 'span',
                className: 'close-icon',
                content: 'x'
            }
        ]
    }
}


/**
 *
 *
 * @param {GalleryElement} gallery
 */
const showGallery = (gallery: GalleryElement) => {
    createGalleryElement({
        tag: 'div',
        className: 'gallery-curtain',
        children: [
            {
                tag: 'div',
                className: 'gallery-inner'
            },
            {
                ref: 'loader',
                tag: 'div',
                className: 'loader-wrapper',
                children: [
                    {
                        tag: 'div',
                        className: 'loader'
                    }
                ]
            },
            PreviousImageButton(gallery, (refs: { [key:string] : any }) => {
                return refs.activeImage.element
            }),
            NextImageButton(gallery, (refs: { [key:string] : any }) => {
                return refs.activeImage.element
            }),
            ActiveImage(gallery),
            CloseButton(gallery)
        ]
    }, document.body)
}

/**
 *
 *
 */
const loadGalleryElements = () => {
    const galleries = getGalleries()
    const buttons = getGalleryButtons()
}

/**
 * Downloada the image from source url and once download updates the active image with this image data
 *
 * @param {(string | undefined)} prevUrl
 * @param {HTMLImageElement} image
 * @param {{ [key: string]: any; }} refs
 * @param {GalleryElement} gallery
 */
function loadGalleryImage(sourceUrl: string | undefined, image: HTMLImageElement, refs: { [key: string]: any; }, gallery: GalleryElement) {
    refs.loader.element.setAttribute('style' , 'display: flex;')
    image.setAttribute('style' , 'fade-out')
    if (sourceUrl === undefined) {
        toggleButtons(gallery, refs);
        return 
    }
        
    image.onload = function () {
        console.log('loaded')
        refs.loader.element.setAttribute('style' , 'display: none')
        image.setAttribute('style' , 'fade-in')
        toggleButtons(gallery, refs);
    };
    image.onerror = (error: any) => {
        console.log('error' , error);
    };
    
    image.src = sourceUrl
}

/**
 *
 *
 * @param {GalleryElement} gallery
 * @param {{ [key: string]: any; }} refs
 */
function toggleButtons(gallery: GalleryElement, refs: { [key: string]: any; }) {
    if (gallery.hasImage(gallery.index + 1)) {
        refs.rightButton.element.setAttribute('style', 'display: flex;');
    } else {
        refs.rightButton.element.setAttribute('style', 'display: none;');
    }
    if (gallery.index === 0) {
        refs.leftButton.element.setAttribute('style', 'display: none;');
    } else {
        refs.leftButton.element.setAttribute('style', 'display: flex;');
    }
}

window.addEventListener('load', loadGalleryElements)