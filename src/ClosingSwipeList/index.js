import React, { Component } from 'react';
import { StyleSheet, View, Text, Animated, PanResponder, ScrollView } from 'react-native';
import { Dimensions, Platform, TouchableOpacity } from 'react-native';
export const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const MAX_LIST_HEIGHT = SCREEN_HEIGHT;

export default class App extends Component {
  positionY = new Animated.Value(0);

  fingerPositionY = null;
  fingerStartPositionY = null;
  offset = null;

  // top/bottom
  swipeDirection = null;

  state = {
    isMoving: false,
    isListVisible: false,
    isScrolledToTop: true,
  };

  panResponder = PanResponder.create({
    // Ask to be the responder:
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

    onPanResponderGrant: ({ nativeEvent }, gestureState) => {
      this.fingerStartPositionY = nativeEvent.pageY;

      if (this.state.isScrolledToTop) {
        this.offset = nativeEvent.pageY;
      }
    },
    onPanResponderMove: ({ nativeEvent }, state) => {
      // if we haven't saved prev event data  we shouldn't execute next actions
      if (this.fingerPositionY === null) {
        return (this.fingerPositionY = nativeEvent.pageY);
      }

      this.swipeDirection = nativeEvent.pageY > this.fingerPositionY ? 'bottom' : 'top';
      this.fingerPositionY = nativeEvent.pageY;

      const offsetFromStart = this.fingerStartPositionY - this.fingerPositionY;

      // we should detect offset to top
      const offsetFromStartToBottom = offsetFromStart > 0 ? 0 : Math.abs(offsetFromStart);
      const nextListHeight = offsetFromStartToBottom <= 0 ? MAX_LIST_HEIGHT : MAX_LIST_HEIGHT - offsetFromStartToBottom;

      // const offsetFromStartToBottom = state.dy > 0 ? state.dy : 0;
      // const nextListHeight = offsetFromStartToBottom <= 0 ? MAX_LIST_HEIGHT : MAX_LIST_HEIGHT - offsetFromStartToBottom;

      // if moving was started we should move without checking conditions
      if (this.state.isMoving) {
        this.move(nextListHeight);
      }

      // if content is scrolled to top, and user makes swipe to bottom we can start moving(changing list height)
      if (this.swipeDirection === 'bottom' && this.state.isScrolledToTop) {
        this.move(nextListHeight);
        !this.state.isMoving && this.setState({ isMoving: true });
      }
    },
    onPanResponderTerminationRequest: (evt, gestureState) => true,
    onPanResponderRelease: ({ nativeEvent }, gestureState) => {
      if (this.state.isScrolledToTop) {
        MAX_LIST_HEIGHT * 0.5 > nativeEvent.pageY ? this.move(SCREEN_HEIGHT) : this.hideList();
      }

      this.cleanValues();
      this.state.isMoving && this.setState({ isMoving: false });
    },
    onPanResponderTerminate: (evt, gestureState) => {
      // Another component has become the responder, so this gesture
      // should be cancelled
    },
    onShouldBlockNativeResponder: (evt, gestureState) => {
      // Returns whether this component should block native components from becoming the JS
      // responder. Returns true by default. Is currently only supported on android.
      return true;
    },
  });

  cleanValues = () => {
    this.fingerStartPositionY = null;
    this.swipeDirection = null;
    this.fingerPositionY = null;
    this.offset = null;
  };

  move = toValue => Animated.spring(this.positionY, { toValue, bounciness: 0 }).start();

  onScroll = ({ nativeEvent }) => {
    if (this.state.isScrolledToTop !== !nativeEvent.contentOffset.y) {
      this.setState({ isScrolledToTop: !nativeEvent.contentOffset.y });
    }
  };

  // show/hide
  changeListState = async state => {
    this.move(state === 'show' ? MAX_LIST_HEIGHT : 0);

    await new Promise(resolve => setTimeout(() => resolve(), 200));
  };

  showList = () => {
    this.setState({ isListVisible: true }, async () => {
      this.props.onListShow && this.props.onListShow();
      await this.changeListState('show');
    });
  };

  hideList = async () => {
    await this.changeListState('hide');

    this.setState({ isListVisible: false }, () => {
      this.props.onListHide && this.props.onListHide();
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={{
            width: 160,
            height: 40,
            backgroundColor: 'blue',
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={this.showList}
        >
          <Text>Open Swipe Close List</Text>
        </TouchableOpacity>

        {this.state.isListVisible && (
          <Animated.View
            style={{
              height: this.positionY,
              width: SCREEN_WIDTH,
              position: 'absolute',
              bottom: 0,
              left: 0,
            }}
          >
            <ScrollView
              scrollEnabled={!this.state.isMoving}
              onScroll={this.onScroll}
              onScrollEndDrag={this.onScrollEnd}
              scrollEventThrottle={16}
              style={{
                width: '100%',
                backgroundColor: 'grey',
              }}
              contentContainerStyle={{
                justifyContent: 'center',
                alignItems: 'center',
              }}
              bounces={false}
              {...this.panResponder.panHandlers}
            >
              {Array.from(new Array(100)).map((item, i) => (
                <Text key={i}>{`Lorem ipsum
              `}</Text>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

