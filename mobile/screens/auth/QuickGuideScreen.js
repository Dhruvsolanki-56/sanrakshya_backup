import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, TouchableOpacity, Dimensions, ImageBackground, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const guideSteps = [
    {
        id: '1',
        icon: 'sparkles',
        title: 'Welcome to Sanrakshya',
        description: "Your child's personal health companion for a brighter, healthier future.",
        colors: ['#4facfe', '#00f2fe'], // Bright Blue
        bg: '#EAF8FF',
    },
    {
        id: '2',
        icon: 'shield-checkmark',
        title: 'All-in-One Health Log',
        description: 'Easily track vaccination, milestones, and health records in one secure place.',
        colors: ['#10ac84', '#06d6a0'], // Mint Green
        bg: '#E8FBF6',
    },
    {
        id: '3',
        icon: 'pulse',
        title: 'AI-Powered Insights',
        description: 'Receive smart alerts and AI-generated reports on growth patterns and health risks.',
        colors: ['#ff6b6b', '#ff9f43'], // Warm Red/Orange
        bg: '#FFF0ED',
    },
    {
        id: '4',
        icon: 'nutrition',
        title: 'Nutrition & Lifestyle',
        description: 'Get customized recipes, meal plans, and lifestyle tips based on your child’s age.',
        colors: ['#f0932b', '#ffbe76'], // Orange
        bg: '#FFF8E1',
    },
    {
        id: '5',
        icon: 'people',
        title: 'Connect with Experts',
        description: 'Find trusted pediatricians and manage your child’s healthcare appointments effortlessly.',
        colors: ['#00d2d3', '#48dbfb'], // Cyan
        bg: '#E0FAFC',
    },
];

const Slide = ({ item, scrollX, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    // Parallax effects
    const iconTranslateY = scrollX.interpolate({
        inputRange,
        outputRange: [50, 0, 50],
        extrapolate: 'clamp',
    });

    const titleTranslateX = scrollX.interpolate({
        inputRange,
        outputRange: [100, 0, -100],
        extrapolate: 'clamp',
    });

    const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.5, 1, 0.5],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.slideContainer}>
            {/* Icon Circle */}
            <Animated.View
                style={[
                    styles.iconContainer,
                    {
                        transform: [{ translateY: iconTranslateY }, { scale }],
                    },
                ]}
            >
                <LinearGradient
                    colors={item.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradient}
                >
                    <Ionicons name={item.icon} size={width * 0.22} color="#fff" />
                </LinearGradient>
            </Animated.View>

            {/* Content Card */}
            <View style={styles.contentCard}>
                <Animated.Text
                    style={[
                        styles.title,
                        { transform: [{ translateX: titleTranslateX }] },
                    ]}
                >
                    {item.title}
                </Animated.Text>
                <Text style={styles.description}>
                    {item.description}
                </Text>
            </View>
        </View>
    );
};

const Paginator = ({ data, scrollX }) => {
    return (
        <View style={styles.paginatorContainer}>
            {data.map((_, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                const color = scrollX.interpolate({
                    inputRange,
                    outputRange: ['#b2bec3', guideSteps[i].colors[0], '#b2bec3'],
                    extrapolate: 'clamp',
                });


                return (
                    <Animated.View
                        key={i.toString()}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                opacity,
                                backgroundColor: color,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
};

const QuickGuideScreen = ({ navigation }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef(null);

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < guideSteps.length - 1) {
            slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        navigation.replace('ParentHome');
    };

    // Dynamic Background Color based on slide
    const backgroundColor = scrollX.interpolate({
        inputRange: guideSteps.map((_, i) => i * width),
        outputRange: guideSteps.map((item) => item.bg),
    });

    return (
        <Animated.View style={[styles.container, { backgroundColor }]}>
            <View style={{ flex: 1 }}>
                <FlatList
                    data={guideSteps}
                    renderItem={({ item, index }) => <Slide item={item} scrollX={scrollX} index={index} />}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                    bounces={false}
                />
            </View>

            <View style={styles.footer}>
                <Paginator data={guideSteps} scrollX={scrollX} />

                <View style={styles.buttonContainer}>
                    {currentIndex === guideSteps.length - 1 ? (
                        <TouchableOpacity
                            style={styles.getStartedButton}
                            onPress={handleComplete}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#4facfe', '#00f2fe']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.getStartedText}>Get Started</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.navButtons}>
                            <TouchableOpacity onPress={handleComplete} style={styles.skipButton}>
                                <Text style={styles.skipText}>Skip</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.nextButton}
                                onPress={handleNext}
                            >
                                <Ionicons name="arrow-forward" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slideContainer: {
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    iconContainer: {
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
        elevation: 20,
    },
    iconGradient: {
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: (width * 0.6) / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    contentCard: {
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2d3436',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 16,
        color: '#636e72',
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: 'System', // Use default system font which is usually good
    },
    footer: {
        height: height * 0.25,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 30,
        width: '100%',
    },
    paginatorContainer: {
        flexDirection: 'row',
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 5,
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: 20,
    },
    navButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    skipButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    skipText: {
        fontSize: 16,
        color: '#636e72',
        fontWeight: '600',
    },
    nextButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2d3436',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    getStartedButton: {
        width: '100%',
        height: 60,
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#4facfe',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    gradientButton: {
        flex: 1,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    getStartedText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
});

export default QuickGuideScreen;
