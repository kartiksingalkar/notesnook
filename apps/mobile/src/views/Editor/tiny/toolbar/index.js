import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { ScrollView, View } from 'react-native';
import { useTracked } from '../../../../provider';
import { normalize } from '../../../../utils/SizeUtils';
import { TOOLBAR_CONFIG } from './config';
import { properties, toolbarRef } from './constants';
import ToolbarGroup from './group';
import Tooltip from './tooltip';

const EditorToolbar = React.memo(
  () => {
    const [state] = useTracked();
    const {colors} = state;
    const config = TOOLBAR_CONFIG;

    useEffect(() => {
      properties.selection = {};
      return () => {
        properties.selection = {};
      };
    }, []);

    return (
      <>
        <View
          style={{
            width: '100%',
            minHeight: normalize(50),
            position:Platform.OS === "android" ? "absolute" : "relative",
            bottom:Platform.OS === "android" ? 0 : null
          }}>
          <Tooltip />
          <ScrollView
            ref={toolbarRef}
            style={{
              width: '100%',
              maxWidth: '100%',
              minHeight: normalize(50),
              paddingLeft: 6,
              backgroundColor:colors.nav,
              borderTopRightRadius:5,
              borderTopLeftRadius:5,
              zIndex:11
            }}
            onScrollBeginDrag={() => {
              //eSendEvent('showTooltip');
            }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {config.map((item, index) => (
              <ToolbarGroup key={item[0].format} group={item} />
            ))}
          </ScrollView>
        </View>
      </>
    );
  },
  () => true,
);

export default EditorToolbar;
