declare module 'react-plotly.js' {
  import * as React from 'react';
  
  interface Figure {
    data?: any[];
    layout?: any;
    frames?: any[];
    config?: any;
  }

  interface PlotParams extends Figure {
    style?: React.CSSProperties;
    className?: string;
    onInitialized?: (figure: Figure, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: Figure, graphDiv: HTMLElement) => void;
    onPurge?: (figure: Figure, graphDiv: HTMLElement) => void;
    onError?: (err: Error) => void;
    onSelected?: (event: any) => void;
    onSelecting?: (event: any) => void;
    onRestyle?: (event: any) => void;
    onRelayout?: (event: any) => void;
    onClickAnnotation?: (event: any) => void;
    onLegendClick?: (event: any) => void;
    onLegendDoubleClick?: (event: any) => void;
    onSliderChange?: (event: any) => void;
    onSliderEnd?: (event: any) => void;
    onSliderStart?: (event: any) => void;
    onClick?: (event: any) => void;
    onHover?: (event: any) => void;
    onUnhover?: (event: any) => void;
    useResizeHandler?: boolean;
    debug?: boolean;
    divId?: string;
    revision?: number;
  }

  export default class Plot extends React.Component<PlotParams> {}
} 