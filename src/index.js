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
const uuid = (length) => {
    const items = [...Array(length).keys()];
    return items.map(i => {
        const char = Math.floor(Math.random() * 26);
        const sin = Math.random() < 0.5;
        const code = sin === true ? 97 : 65;
        return String.fromCharCode(char + code);
    }).join('');
};
const elements = (list) => {
    let items = [];
    list.forEach(i => [
        items.push(i)
    ]);
    return items;
};
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
    return {
        dimensions: element.getBoundingClientRect(),
        id: element.getAttribute(GalleryKeys.id),
        active: false,
        imageUrls: getImageUrls(element),
        element,
        index: 0,
        next() {
            if ((this.index + 1) <= this.imageUrls.length - 1) {
                this.index += 1;
                return this.imageUrls[this.index];
            }
            return undefined;
        },
        prev() {
            if ((this.index - 1) >= 0) {
                this.index -= 1;
                return this.imageUrls[this.index];
            }
            return undefined;
        }
    };
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
                ref: 'leftButton',
                tag: 'div',
                className: 'gallery-left-button',
                onClick: (event, refs) => {
                    const prevUrl = gallery.prev();
                    if (prevUrl === undefined)
                        throw new Error('left button should be hidden');
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
            },
            {
                ref: 'rightButton',
                tag: 'div',
                className: 'gallery-right-button',
                onClick: (event, refs) => {
                    const nextUrl = gallery.next();
                    if (nextUrl === undefined)
                        throw new Error('right button should be hidden');
                    toggleActiveImage(gallery, refs);
                },
                children: [
                    {
                        tag: 'span',
                        className: 'left-arrow',
                        content: '>'
                    }
                ]
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
            {
                ref: 'activeImage',
                tag: 'img',
                className: 'gallery-image-active fade-in',
                attributes: {
                    index: '0'
                },
                onAdded: function (imageElement, refs) {
                    const elem = imageElement;
                    const index = imageElement.getAttribute('index');
                    elem.onload = function () {
                        refs.loader.element.remove();
                    };
                    elem.src = gallery.imageUrls[parseInt(index)];
                }
            },
            {
                ref: 'nextImage',
                tag: 'img',
                className: 'gallery-image-next fade-out',
                attributes: {
                    index: '1'
                },
                onAdded: (imageElement, refs) => {
                    const elem = imageElement;
                    const index = imageElement.getAttribute('index');
                    elem.onload = function () {
                        refs.loader.element.remove();
                    };
                    elem.src = gallery.imageUrls[parseInt(index)];
                }
            },
            {
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
            }
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
    if (gallery.index < gallery.imageUrls.length - 1) {
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
