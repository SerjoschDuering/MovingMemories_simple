declare module 'animate-ui' {
  import * as React from 'react';

  export interface StarsBackgroundProps {
    pointerEvents?: boolean;
    starColor?: string;
    transition?: any;
    speed?: number;
    factor?: number;
    className?: string;
    children?: React.ReactNode;
  }
  export const StarsBackground: React.FC<StarsBackgroundProps>;

  export interface HighlightTextProps {
    text: string;
    transition?: any;
    inViewOnce?: boolean;
    inViewMargin?: string;
    inView?: boolean;
    className?: string;
  }
  export const HighlightText: React.FC<HighlightTextProps>;

  // Forward-looking minimal typings for other components we may use
  export const GradientBackground: React.FC<any>;
  export const Tooltip: React.FC<any>;
  export const Popover: React.FC<any>;
  export const PopoverTrigger: React.FC<any>;
  export const PopoverContent: React.FC<any>;
  export const MotionEffect: React.FC<any>;
  export const IconButton: React.FC<any>;
  export const Tabs: React.FC<any>;
  export const TabsList: React.FC<any>;
  export const TabsTrigger: React.FC<any>;
  export const TabsContents: React.FC<any>;
  export const TabsContent: React.FC<any>;
  export const NotificationList: React.FC<any>;
}


