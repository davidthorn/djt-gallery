"use strict";
var GalleryKeys;
(function (GalleryKeys) {
    GalleryKeys["id"] = "gallery-id";
    GalleryKeys["image"] = "images";
    GalleryKeys["gallery"] = "[gallery]";
    GalleryKeys["buttons"] = "[gallery-ref]";
    GalleryKeys["ref"] = "gallery-ref";
    GalleryKeys["leftArrowClassName"] = "left-arrow";
    GalleryKeys["curtainSelector"] = ".gallery-curtain";
})(GalleryKeys || (GalleryKeys = {}));
class Gallery {
    constructor(element, imageUrls, id) {
        this.imageUrls = [];
        this.index = 0;
        this.dimensions = element.getBoundingClientRect();
        this.id = id;
        this.active = false;
        this.imageUrls = imageUrls;
        this.element = element;
    }
    next() {
        if (this.hasNextImage()) {
            this.index += 1;
            return this.imageUrls[this.index];
        }
        return undefined;
    }
    prev() {
        if (this.hasPreviousImage()) {
            this.index -= 1;
            return this.imageUrls[this.index];
        }
        return undefined;
    }
    hasNextImage() {
        return this.hasImage(this.index + 1);
    }
    hasPreviousImage() {
        return this.hasImage(this.index - 1);
    }
    hasActiveImage() {
        return this.hasImage(this.index);
    }
    hasImage(index) {
        if (index < 0)
            return false;
        return index <= this.imageUrls.length - 1;
    }
}
const createGalleryElement = (config, parent) => {
    const { id, className, attributes, children, onClick, onAdded, ref, refs, content } = config;
    if (refs === undefined) {
        config.refs = {};
    }
    const element = document.createElement(config.tag);
    if (parent !== undefined) {
        parent.appendChild(element);
    }
    config.element = element;
    if (ref !== undefined) {
        config[ref] = config;
    }
    if (id !== undefined) {
        element.setAttribute('id', id);
    }
    if (className !== undefined) {
        element.className += className;
    }
    if (attributes !== undefined) {
        Object.keys(attributes).forEach(key => {
            const attr = attributes[key];
            element.setAttribute(key, attr);
        });
    }
    if (children !== undefined) {
        children.forEach(child => {
            if (child.ref !== undefined) {
                config.refs[child.ref] = child;
                config[child.ref] = child;
                child.refs = config.refs;
            }
            createGalleryElement(child, element);
        });
    }
    if (onClick !== undefined) {
        const cb = onClick.bind(config);
        element.addEventListener('click', function (e) {
            cb(e, config.refs);
        });
    }
    if (onAdded !== undefined) {
        const cb = onAdded.bind(config);
        cb(element, config.refs);
    }
    if (content !== undefined) {
        element.innerHTML = content;
    }
    return element;
};
/**
 * Creates a string containing only random upper and lower case letters
 *
 * @param {number} length
 * @returns {string}
 */
const uuid = (length) => {
    const items = [...Array(length).keys()];
    return items.map(i => {
        const char = Math.floor(Math.random() * 26);
        const sin = Math.random() < 0.5;
        const code = sin === true ? 97 : 65;
        return String.fromCharCode(char + code);
    }).join('');
};
/**
 * Converts a NodeListOf<Element> to a standard array
 *
 * @param {NodeListOf<Element>} list
 * @returns {Element[]}
 */
const elements = (list) => {
    let items = [];
    list.forEach(i => [
        items.push(i)
    ]);
    return items;
};
/**
 * Retrieves all images urls from the images attribute of this element
 * Returns an empty array is the attribute is not found
 *
 * @param {Element} element
 * @returns {string[]}
 */
const getImageUrls = (element) => {
    const ref = element.getAttribute(GalleryKeys.image);
    if (ref === null)
        return [];
    return ref.split(',');
};
const convertElement = (element) => {
    if (element.getAttribute(GalleryKeys.id) === null) {
        element.setAttribute(GalleryKeys.id, uuid(10));
    }
    element.setAttribute('style', 'display: none');
    return new Gallery(element, getImageUrls(element), element.getAttribute(GalleryKeys.id));
};
/**
 * Returns all GalleryElem
 *
 * @returns {GalleryElement[]}
 */
const getGalleries = () => {
    const galleryElements = document.querySelectorAll(GalleryKeys.gallery);
    return elements(galleryElements).map(convertElement);
};
const getGalleryButtons = () => {
    const galleryButtonElements = document.querySelectorAll(GalleryKeys.buttons);
    return elements(galleryButtonElements).map(convertButtonElement).filter(i => { return i !== undefined; }).map(i => i);
};
const getGallery = (id) => {
    const galleryElements = getGalleries().filter(i => { return i.id === id; });
    return galleryElements.length > 0 ? galleryElements[0] : undefined;
};
const convertButtonElement = (element) => {
    const id = element.getAttribute(GalleryKeys.ref);
    if (id === null)
        return undefined;
    const gallery = getGallery(id);
    if (gallery === undefined)
        return undefined;
    element.addEventListener('click', (e) => {
        showGallery(gallery);
    });
    return {
        element,
        gallery
    };
};
const PreviousImageButton = function (gallery) {
    return {
        ref: 'leftButton',
        tag: 'div',
        className: 'gallery-left-button',
        onClick: (event, refs) => {
            const prevUrl = gallery.prev();
            if (prevUrl === undefined)
                throw new Error('previous button should be hidden');
            toggleActiveImage(gallery, refs);
        },
        onAdded: (element) => {
            element.setAttribute('style', 'display: none');
        },
        children: [
            {
                tag: 'span',
                className: 'left-arrow',
                content: '<'
            }
        ]
    };
};
const GalleryImage = function (gallery, active, index) {
    return {
        ref: active == true ? 'activeImage' : 'nextImage',
        tag: 'img',
        className: `gallery-image-${active ? 'active' : 'next'} ${active ? 'fade-in' : 'fade-out'}`,
        attributes: {
            index: index.toString()
        },
        onAdded: function (imageElement, refs) {
            const elem = imageElement;
            const index = parseInt(imageElement.getAttribute('index'));
            if (!gallery.hasImage(index))
                return;
            elem.onload = function () {
                refs.loader.element.remove();
            };
            elem.src = gallery.imageUrls[index];
        }
    };
};
const ActiveImage = function (gallery) {
    return GalleryImage(gallery, true, 0);
};
const NextImage = function (gallery) {
    return GalleryImage(gallery, false, 1);
};
const NextImageButton = function (gallery) {
    return {
        ref: 'rightButton',
        tag: 'div',
        className: 'gallery-right-button',
        onClick: (event, refs) => {
            const nextUrl = gallery.next();
            if (nextUrl === undefined)
                throw new Error('next button should be hidden');
            toggleActiveImage(gallery, refs);
        },
        onAdded: (element) => {
            if (!gallery.hasNextImage()) {
                element.setAttribute('style', 'display: none');
            }
        },
        children: [
            {
                tag: 'span',
                className: 'left-arrow',
                content: '>'
            }
        ]
    };
};
const CloseButton = function (gallery) {
    return {
        ref: 'closeButton',
        tag: 'div',
        className: 'gallery-close-button',
        onClick: function () {
            document.querySelectorAll(GalleryKeys.curtainSelector).forEach(i => {
                i.className = `${i.className} fade-out`;
                setTimeout(() => {
                    gallery.index = 0;
                    i.remove();
                }, 1000);
            });
        },
        children: [
            {
                tag: 'span',
                className: 'close-icon',
                content: 'x'
            }
        ]
    };
};
const showGallery = (gallery) => {
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
            PreviousImageButton(gallery),
            NextImageButton(gallery),
            ActiveImage(gallery),
            NextImage(gallery),
            CloseButton(gallery)
        ]
    }, document.body);
};
const loadGalleryElements = () => {
    const galleries = getGalleries();
    const buttons = getGalleryButtons();
};
window.addEventListener('load', loadGalleryElements);
function toggleActiveImage(gallery, refs) {
    switch (gallery.index % 2 === 0) {
        case true: // active image is active
            refs.nextImage.element.className = 'gallery-image-next fade-out';
            refs.activeImage.element.className = 'gallery-image-next fade-in';
            break;
        case false: // next image is active
            refs.nextImage.element.className = 'gallery-image-next fade-in';
            refs.activeImage.element.className = 'gallery-image-next fade-out';
            break;
    }
    if (gallery.hasImage(gallery.index + 1)) {
        refs.rightButton.element.setAttribute('style', 'display: flex;');
    }
    else {
        refs.rightButton.element.setAttribute('style', 'display: none;');
    }
    if (gallery.index === 0) {
        refs.leftButton.element.setAttribute('style', 'display: none;');
    }
    else {
        refs.leftButton.element.setAttribute('style', 'display: flex;');
    }
}
