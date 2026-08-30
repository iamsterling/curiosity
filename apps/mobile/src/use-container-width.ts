import { useCallback, useState } from "react";
import { useWindowDimensions, type LayoutChangeEvent } from "react-native";

export const useContainerWidth = () => {
  const window = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number>();
  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    const nextWidth = nativeEvent.layout.width;
    setMeasuredWidth((current) =>
      current === nextWidth ? current : nextWidth,
    );
  }, []);
  return { onLayout, width: measuredWidth ?? window.width } as const;
};
