import * as React from "react";
import { cn } from "../../lib/utils";

interface WaitIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  disabled?: boolean;
  isSending?: boolean;
  isDark?: boolean;
}

const WaitIcon = React.forwardRef<SVGSVGElement, WaitIconProps>(
  ({ className, size = 32, disabled = false, isSending = false, isDark = false, ...props }, ref) => {
    // 根据状态确定颜色，和 SendIcon 保持一致
    const getIconColor = () => {
      if (disabled || isSending) {
        return isDark ? "#474747" : "#d2d2d2"; // 根据主题设置禁用状态颜色
      }
      return "currentColor"; // 使用传入的 className 中的颜色，和 SendIcon 保持一致
    };

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 1024 1024"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("icon", className, {
          "cursor-not-allowed": disabled || isSending,
          "cursor-pointer": !disabled && !isSending
        })}
        {...props}
      >
        <path 
          d="M512 1024A512 512 0 1 1 512 0a512 512 0 0 1 0 1024zM320 576a64 64 0 1 0 0-128 64 64 0 0 0 0 128z m192 0a64 64 0 1 0 0-128 64 64 0 0 0 0 128z m192 0a64 64 0 1 0 0-128 64 64 0 0 0 0 128z" 
          fill={getIconColor()}
        />
      </svg>
    );
  }
);

WaitIcon.displayName = "WaitIcon";

export { WaitIcon };
export type { WaitIconProps };
