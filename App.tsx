import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  Pressable,
  Appearance,
  PixelRatio,
  Dimensions,
} from "react-native";
import { BottomTabs } from "./components/BottomTabs";
import { SearchBar } from "./components/SearchBar";
import { Trending } from "./components/Trending";
import { Cards } from "./components/Cards";

import SunIcon from "./icons/SunIcon";
import MoonIcon from "./icons/MoonIcon";
import { useEffect, useRef, useState } from "react";
import {
  Canvas,
  Fill,
  Image,
  ImageShader,
  makeImageFromView,
  Shader,
  Skia,
  type SkImage,
} from "@shopify/react-native-skia";
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const pd = PixelRatio.get();
const { width, height } = Dimensions.get("window");

type Value = string | number;
type Values = Value[];

export const glsl = (source: TemplateStringsArray, ...values: Values) => {
  const processed = source.flatMap((s, i) => [s, values[i]]).filter(Boolean);
  return processed.join("");
};

export const frag = (source: TemplateStringsArray, ...values: Values) => {
  const code = glsl(source, ...values);
  const rt = Skia.RuntimeEffect.Make(code);
  if (rt === null) {
    throw new Error("Couln't Compile Shader");
  }
  return rt;
};

type Transition = string;

const transition = (t: Transition) => {
  return frag`
  uniform shader image1;
  uniform shader image2;

  uniform float progress;
  uniform float2 resolution;
  
  half4 getFromColor(float2 uv) {
    return image1.eval(uv * resolution);
  }
  
  half4 getToColor(float2 uv) {
    return image2.eval(uv * resolution);
  }
  
  ${t}

  half4 main(vec2 xy) {
    vec2 uv = xy / resolution;
    return transition(uv);
  }
  `;
};

const directionalwrap: Transition = glsl`
// Author: pschroen
// License: MIT

const vec2 direction = vec2(-1.0, 1.0);

const float smoothness = 0.5;
const vec2 center = vec2(0.5, 0.5);

vec4 transition (vec2 uv) {
  vec2 v = normalize(direction);
  v /= abs(v.x) + abs(v.y);
  float d = v.x * center.x + v.y * center.y;
  float m = 1.0 - smoothstep(-smoothness, 0.0, v.x * uv.x + v.y * uv.y - (d - 0.5 + progress * (1.0 + smoothness)));
  return mix(getFromColor((uv - 0.5) * (1.0 - m) + 0.5), getToColor((uv - 0.5) * m + 0.5), m);
}


`;

export default function App() {
  const progress = useSharedValue(0);
  const colorScheme = useColorScheme();
  const colorSchemeSv = useSharedValue(colorScheme);

  const ref = useRef<SafeAreaView>(null);
  const [firstSnapshot, setFirstSnapshot] = useState<SkImage | null>(null);
  const [secondSnapshot, setSecondSnapshot] = useState<SkImage | null>(null);

  const animatedBackgroundColor = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        colorSchemeSv.value === "light"
          ? ["#020617", "#ffffff"]
          : ["#ffffff", "#020617"],
      ),
    };
  });

  const changeTheme = async () => {
    progress.value = 0;
    const snapshot1 = await makeImageFromView(ref);
    setFirstSnapshot(snapshot1);
    Appearance.setColorScheme(colorScheme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    const listener = Appearance.addChangeListener(async ({ colorScheme }) => {
      setTimeout(async () => {
        console.log(colorScheme);
        const snapshot2 = await makeImageFromView(ref);
        setSecondSnapshot(snapshot2);
        colorSchemeSv.value = colorScheme;
        progress.value = withTiming(1, { duration: 1700 }, () => {
          runOnJS(setFirstSnapshot)(null);
          runOnJS(setSecondSnapshot)(null);
        });
      }, 100);
    });

    return () => {
      listener.remove();
    };
  }, []);

  const uniforms = useDerivedValue(() => {
    return {
      progress: progress.value,
      resolution: [width, height],
    };
  });

  const transitioning = firstSnapshot !== null && secondSnapshot !== null;
  if (transitioning) {
    return (
      <Animated.View style={[{ flex: 1 }, animatedBackgroundColor]}>
        <Canvas style={{ height: height }}>
          <Fill>
            <Shader source={transition(directionalwrap)} uniforms={uniforms}>
              <ImageShader
                image={firstSnapshot}
                fit="cover"
                width={width}
                height={height}
              />
              <ImageShader
                image={secondSnapshot}
                fit="cover"
                width={width}
                height={height}
              />
            </Shader>
          </Fill>
        </Canvas>
      </Animated.View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      {firstSnapshot && (
        <Canvas style={[{ height: height }]}>
          <Image
            image={firstSnapshot}
            fit="cover"
            width={width}
            height={height}
          />
        </Canvas>
      )}
      <View
        ref={ref}
        style={[
          styles.container,
          colorScheme === "light"
            ? { backgroundColor: "white" }
            : { backgroundColor: "#020617" },
        ]}
      >
        <View
          style={[
            { width: width },
            colorScheme === "light"
              ? { backgroundColor: "white" }
              : { backgroundColor: "#020617" },
          ]}
        >
          <View style={styles.padding}>
            <View style={styles.row}>
              <Text
                style={[
                  styles.header,
                  colorScheme === "light"
                    ? { color: "#0f172a" }
                    : { color: "#f1f5f9" },
                ]}
              >
                Home
              </Text>
              <Pressable style={styles.themeSwitcher} onPress={changeTheme}>
                {colorScheme === "light" ? (
                  <MoonIcon color="#1e293b" />
                ) : (
                  <SunIcon color="#e2e8f0" />
                )}
              </Pressable>
            </View>
            <SearchBar />
            <Trending />
            <Cards />
          </View>
          <BottomTabs />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    paddingTop: 53,
  },
  padding: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  themeSwitcher: {
    paddingBottom: 10,
    paddingRight: 4,
    // borderRadius: 8,
  },
  header: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 16,
  },
});
