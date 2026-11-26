import { useMemo } from "react";
import { View, type StyleProp, type TextStyle } from "react-native";

import { Spacing } from "@/constants/theme";

import PullUpWord from "./PullUpWord";

export type WordsPullUpProps = {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  enabled?: boolean;
};

export default function WordsPullUp({
  text,
  textStyle,
  enabled = true,
}: WordsPullUpProps) {
  const paragraphs = useMemo(
    () =>
      text
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0)
        .map((paragraph) =>
          paragraph
            .split("\n")
            .map((line) => line.split(" ").filter((word) => word.length > 0)),
        ),
    [text],
  );

  return (
    <View>
      {paragraphs.map((lines, paragraphIndex) => (
        <View key={paragraphIndex} style={{ marginBottom: Spacing.two }}>
          {lines.map((line, lineIndex) => (
            <View
              key={lineIndex}
              style={{ flexDirection: "row", flexWrap: "wrap" }}
            >
              {line.map((word, wordIndex) => (
                <PullUpWord
                  key={wordIndex}
                  index={wordIndex}
                  style={textStyle}
                  enabled={enabled}
                >
                  {wordIndex < line.length - 1 ? `${word} ` : word}
                </PullUpWord>
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
