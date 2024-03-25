import { View, Image, StyleSheet, Dimensions, Pressable } from "react-native";
import Animated, {
  BounceIn,
  LayoutAnimationConfig,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { atom, useAtom } from "jotai";

import HeartIcon from "../icons/HeartIcon";
import HeartDuotoneIcon from "../icons/HeartDuotoneIcon";
import { themeSwitchAtom } from "../App";

const bikeAtom = atom(false);
const milkAtom = atom(false);
const teddybearAtom = atom(false);
const ballAtom = atom(false);

const bounceIn = BounceIn.duration(400).withInitialValues({
  transform: [{ scale: 0.5 }],
});

export function Cards() {
  return (
    <View style={styles.container}>
      <Card image={require("../images/bike.jpg")} cardAtom={bikeAtom} />
      <Card image={require("../images/milk.jpg")} cardAtom={milkAtom} />
      <Card
        image={require("../images/teddybear.jpg")}
        cardAtom={teddybearAtom}
      />
      <Card image={require("../images/ball.jpg")} cardAtom={ballAtom} />
    </View>
  );
}

function Card({ image, cardAtom }) {
  const [isThemeSwitching] = useAtom(themeSwitchAtom);
  const [isLiked, setIsLiked] = useAtom(cardAtom);
  return (
    <View style={[styles.card, styles.round]}>
      <Image source={image} style={[styles.image, styles.round]} />
      <View style={styles.iconWrapper}>
        <Pressable onPress={() => setIsLiked(!isLiked)}>
          <BlurView intensity={30} tint="regular" style={styles.blurContainer}>
            {isLiked ? (
              <Animated.View entering={isThemeSwitching ? null : bounceIn}>
                <HeartDuotoneIcon color="#67e8f9" />
              </Animated.View>
            ) : (
              <HeartIcon color="#f1f5f9" />
            )}
          </BlurView>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    marginVertical: 16,
  },
  card: {
    position: "relative",
  },
  round: {
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: Dimensions.get("window").width / 2 - 24,
    height: 250,
  },
  blurContainer: {
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    borderRadius: 32,
    position: "absolute",
    bottom: 16,
    right: 16,
    overflow: "hidden",
  },
});
