import React, { CSSProperties, JSX, useEffect, useRef, useState } from "react";
import {
  VscChevronDown,
  VscChevronLeft,
  VscChevronRight,
  VscChevronUp,
} from "react-icons/vsc";
import { twMerge } from "tailwind-merge";
import { IconButton } from "../shared/buttons/icon-button";
import { ChatInterface } from "../features/chat/chat-interface";
import { Container } from "./container";
import { TerminalStatusLabel } from "../features/terminal/terminal-status-label";
import CollapseIcon from "#/icons/collapse.svg?react";
import ExpandIcon from "#/icons/expand.svg?react";
export enum Orientation {
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical",
}

export enum Collapse {
  COLLAPSED = "collapsed",
  SPLIT = "split",
  FILLED = "filled",
}

type ResizablePanelProps = {
  firstChild: React.ReactNode;
  firstClassName: string | undefined;
  secondChild: React.ReactNode;
  secondClassName: string | undefined;
  className: string | undefined;
  orientation: Orientation;
  initialSize: number;
};

export function ResizablePanel({
  firstChild,
  firstClassName,
  secondChild,
  secondClassName,
  className,
  orientation,
  initialSize,
}: ResizablePanelProps): JSX.Element {
  const [firstSize, setFirstSize] = useState<number>(initialSize);
  const [dividerPosition, setDividerPosition] = useState<number | null>(null);
  const firstRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);
  const isHorizontal = orientation === Orientation.HORIZONTAL;
  const [collapse, setCollapse] = isHorizontal ? useState<Collapse>(Collapse.SPLIT) : useState<Collapse>(Collapse.FILLED);

  useEffect(() => {
    if (dividerPosition == null || !firstRef.current) {
      return undefined;
    }
    const getFirstSizeFromEvent = (e: MouseEvent) => {
      const position = isHorizontal ? e.clientX : e.clientY;
      return firstSize + position - dividerPosition;
    };
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const newFirstSize = `${getFirstSizeFromEvent(e)}px`;
      const { current } = firstRef;
      if (current) {
        if (isHorizontal) {
          current.style.width = newFirstSize;
          current.style.minWidth = newFirstSize;
        } else {
          current.style.height = newFirstSize;
          current.style.minHeight = newFirstSize;
        }
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      if (firstRef.current) {
        firstRef.current.style.transition = "";
      }
      if (secondRef.current) {
        secondRef.current.style.transition = "";
      }
      setFirstSize(getFirstSizeFromEvent(e));
      setDividerPosition(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [dividerPosition, firstSize, orientation]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (firstRef.current) {
      firstRef.current.style.transition = "none";
    }
    if (secondRef.current) {
      secondRef.current.style.transition = "none";
    }
    const position = isHorizontal ? e.clientX : e.clientY;
    setDividerPosition(position);
  };

  const getStyleForFirst = () => {
    const style: CSSProperties = { overflow: "hidden" };
    if (collapse === Collapse.COLLAPSED && !isHorizontal) {
      style.opacity = 0;
      style.width = 0;
      style.minWidth = 0;
      style.height = 0;
      style.minHeight = 0;
    } else if (collapse === Collapse.SPLIT) {
      const firstSizePx = `${firstSize}px`;
      if (isHorizontal) {
        style.width = firstSizePx;
        style.minWidth = firstSizePx;
      } else {
        style.height = firstSizePx;
        style.minHeight = firstSizePx;
      }
    } else if (!isHorizontal) {
      style.flexGrow = 1;
    }
    return style;
  };

  const getStyleForSecond = () => {
    const style: CSSProperties = { overflow: "hidden" };
    if (collapse === Collapse.FILLED) {
    } else if (collapse === Collapse.SPLIT) {
      style.flexGrow = 1;
    } else {
      style.flexGrow = 1;
    }
    return style;
  };

  const onCollapse = () => {
    if (collapse === Collapse.SPLIT) {
      setCollapse(Collapse.COLLAPSED);
    } else {
      setCollapse(Collapse.SPLIT);
    }
  };

  const onExpand = () => {
    if (collapse === Collapse.SPLIT) {
      setCollapse(Collapse.FILLED);
    } else {
      setCollapse(Collapse.SPLIT);
    }
  };

  const secrets = React.useMemo(
      // secrets to filter go here
      () => [].filter((secret) => secret !== null),
      [],
    );

    const Terminal = React.useMemo(
      () => React.lazy(() => import("#/components/features/terminal/terminal")),
      [],
    );
  const collapseButton: React.ReactNode = <IconButton
    icon={isHorizontal ? <CollapseIcon /> : <VscChevronUp />}
    ariaLabel="Collapse"
    onClick={onCollapse}
  />;

  const expandButton: React.ReactNode = <IconButton
    icon={isHorizontal ? <ExpandIcon /> : <VscChevronDown />}
    ariaLabel="Expand"
    onClick={onExpand}
  />;

  return (
    <div className={twMerge("flex", !isHorizontal && "flex-col", className)}>
      <div
        ref={firstRef}
        className={twMerge(firstClassName, "transition-all ease-soft-spring")}
        style={getStyleForFirst()}
      >
        {isHorizontal ? <ChatInterface collapse={collapse} collapseButton={collapseButton} expandButton={expandButton}></ChatInterface> : firstChild}
      </div>
      <div
        className={`${isHorizontal ? "cursor-ew-resize w-1 flex-col" : "cursor-ns-resize h-3 flex-row"} shrink-0 flex justify-center items-center`}
        onMouseDown={collapse === Collapse.SPLIT ? onMouseDown : undefined}
      >
      </div>
      <div
        ref={secondRef}
        className={twMerge(secondClassName, "transition-all ease-soft-spring")}
        style={getStyleForSecond()}
      >
        {isHorizontal && secondChild}
        {!isHorizontal && <Container
                        className="h-full overflow-scroll"
                        label={<TerminalStatusLabel />}
                        collapse={collapse}
                        collapseButton={collapseButton}
                        expandButton={expandButton}
                      >
                        {/* Terminal uses some API that is not compatible in a server-environment. For this reason, we lazy load it to ensure
                         * that it loads only in the client-side. */}
                        <React.Suspense fallback={<div className="h-full" />}>
                          <Terminal secrets={secrets} />
                        </React.Suspense>
                      </Container>}
      </div>
    </div>
  );
}
