import { View, Text } from 'react-native'
import React from 'react';
import { NavigationProp, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type StockRow = {
  symbol: string;
  name: string;
  lastSale: number;
  netChange: number;
  pctChange: number;
  marketCap: number;
}

export default function stockDisplay() {

    const route = useRoute<RouteProp<RootStackParamList, 'stockDisplay'>>();

    const stockInfo = {...route.params};

  return (
    <View>
      <Text>stockDisplay:</Text>
      
    </View>
  )
}