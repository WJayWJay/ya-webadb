import { mergeStyleSets, StackItem } from '@fluentui/react';
import { ReactNode, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ResizeObserver, Size } from './resize-observer';
import { forwardRef } from '../utils/with-display-name';

export interface DeviceViewProps {
    width: number;

    height: number;

    bottomElement?: ReactNode;

    children?: ReactNode;
}

export interface DeviceViewRef {
    enterFullscreen(): void;
}

export const DeviceView = forwardRef<DeviceViewRef>('DeviceView')(({
    width,
    height,
    bottomElement,
    children,
}: DeviceViewProps, ref) => {
    const styles = mergeStyleSets({
        outer: {
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
        },
        inner: {
            position: 'absolute',
            transformOrigin: 'top left',
        },
        bottom: {
            position: 'absolute',
        },
    });

    const [containerSize, setContainerSize] = useState<Size>({ width: 0, height: 0 });
    const [bottomSize, setBottomSize] = useState<Size>({ width: 0, height: 0 });

    // Container size minus bottom element size
    const usableSize = useMemo(() => ({
        width: containerSize.width,
        height: containerSize.height - bottomSize.height,
    }), [containerSize, bottomSize]);

    // Compute sizes after scaling
    const childrenStyle = useMemo(() => {
        let scale: number;
        let childrenWidth: number;
        let childrenHeight: number;
        let childrenTop: number;
        let childrenLeft: number;

        if (width === 0 || usableSize.width === 0) {
            scale = 1;
            childrenWidth = 0;
            childrenHeight = 0;
            childrenTop = 0;
            childrenLeft = 0;
        } else {
            const videoRatio = width / height;
            const containerRatio = usableSize.width / usableSize.height;

            if (videoRatio > containerRatio) {
                scale = usableSize.width / width;
                childrenWidth = usableSize.width;
                childrenHeight = height * scale;
                childrenTop = (usableSize.height - childrenHeight) / 2;
                childrenLeft = 0;
            } else {
                scale = usableSize.height / height;
                childrenWidth = width * scale;
                childrenHeight = usableSize.height;
                childrenTop = 0;
                childrenLeft = (usableSize.width - childrenWidth) / 2;
            }
        }

        return {
            scale,
            width: childrenWidth,
            height: childrenHeight,
            top: childrenTop,
            left: childrenLeft,
        };
    }, [width, height, usableSize]);

    const containerRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => ({
        enterFullscreen() { containerRef.current!.requestFullscreen(); },
    }), []);

    return (
        <StackItem grow>
            <ResizeObserver
                className={styles.outer}
                ref={containerRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'black',
                }}
                onResize={setContainerSize}
            >
                <div
                    className={styles.inner}
                    style={{
                        top: childrenStyle.top,
                        left: childrenStyle.left,
                        width,
                        height,
                        transform: `scale(${childrenStyle.scale})`,
                    }}
                >
                    {children}
                </div>

                <ResizeObserver
                    className={styles.bottom}
                    style={{
                        top: childrenStyle.top + childrenStyle.height,
                        left: childrenStyle.left,
                        width: childrenStyle.width,
                    }}
                    onResize={setBottomSize}
                >
                    {(!!width && !!bottomElement) && bottomElement}
                </ResizeObserver>
            </ResizeObserver>
        </StackItem>
    );
});