/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/network", "vs/nls", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/css!./media/resourceviewer"], function (require, exports, DOM, lifecycle_1, network_1, nls, themeService_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BinarySize {
        static formatSize(size) {
            if (size < BinarySize.KB) {
                return nls.localize('sizeB', "{0}B", size);
            }
            if (size < BinarySize.MB) {
                return nls.localize('sizeKB', "{0}KB", (size / BinarySize.KB).toFixed(2));
            }
            if (size < BinarySize.GB) {
                return nls.localize('sizeMB', "{0}MB", (size / BinarySize.MB).toFixed(2));
            }
            if (size < BinarySize.TB) {
                return nls.localize('sizeGB', "{0}GB", (size / BinarySize.GB).toFixed(2));
            }
            return nls.localize('sizeTB', "{0}TB", (size / BinarySize.TB).toFixed(2));
        }
    }
    BinarySize.KB = 1024;
    BinarySize.MB = BinarySize.KB * BinarySize.KB;
    BinarySize.GB = BinarySize.MB * BinarySize.KB;
    BinarySize.TB = BinarySize.GB * BinarySize.KB;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const borderColor = theme.getColor(theme_1.IMAGE_PREVIEW_BORDER);
        collector.addRule(`.monaco-resource-viewer.image img { border : 1px solid ${borderColor ? borderColor.toString() : ''}; }`);
    });
    /**
     * Helper to actually render the given resource into the provided container. Will adjust scrollbar (if provided) automatically based on loading
     * progress of the binary resource.
     */
    class ResourceViewer {
        static show(descriptor, container, scrollbar, delegate) {
            // Ensure CSS class
            container.className = 'monaco-resource-viewer';
            // Large Files
            if (typeof descriptor.size === 'number' && descriptor.size > ResourceViewer.MAX_OPEN_INTERNAL_SIZE) {
                return FileTooLargeFileView.create(container, descriptor.size, scrollbar, delegate);
            }
            // Seemingly Binary Files
            else {
                return FileSeemsBinaryFileView.create(container, descriptor, scrollbar, delegate);
            }
        }
    }
    exports.ResourceViewer = ResourceViewer;
    ResourceViewer.MAX_OPEN_INTERNAL_SIZE = BinarySize.MB * 200; // max size until we offer an action to open internally
    class FileTooLargeFileView {
        static create(container, descriptorSize, scrollbar, delegate) {
            const size = BinarySize.formatSize(descriptorSize);
            delegate.metadataClb(size);
            DOM.clearNode(container);
            const label = document.createElement('span');
            label.textContent = nls.localize('nativeFileTooLargeError', "The file is not displayed in the editor because it is too large ({0}).", size);
            container.appendChild(label);
            scrollbar.scanDomNode();
            return lifecycle_1.Disposable.None;
        }
    }
    class FileSeemsBinaryFileView {
        static create(container, descriptor, scrollbar, delegate) {
            delegate.metadataClb(typeof descriptor.size === 'number' ? BinarySize.formatSize(descriptor.size) : '');
            DOM.clearNode(container);
            const disposables = new lifecycle_1.DisposableStore();
            const label = document.createElement('p');
            label.textContent = nls.localize('nativeBinaryError', "The file is not displayed in the editor because it is either binary or uses an unsupported text encoding.");
            container.appendChild(label);
            if (descriptor.resource.scheme !== network_1.Schemas.data) {
                const link = DOM.append(label, DOM.$('a.embedded-link'));
                link.setAttribute('role', 'button');
                link.textContent = nls.localize('openAsText', "Do you want to open it anyway?");
                disposables.add(DOM.addDisposableListener(link, DOM.EventType.CLICK, () => delegate.openInternalClb(descriptor.resource)));
            }
            scrollbar.scanDomNode();
            return disposables;
        }
    }
});
//# sourceMappingURL=resourceViewer.js.map