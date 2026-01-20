import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList, Dimensions } from 'react-native';
import { LineChart } from "react-native-gifted-charts";


type MonthlyClosePoint = {
  date: string;     // "2026-01-09"
  close: number;    // 304.22
};

type PointShape = {
    value: number
}

type NormalizedMonthlyCloseSeries = {
  symbol: string;
  lastRefreshed: string;
  timeZone?: string;
  points: MonthlyClosePoint[]; // sorted oldest -> newest
};

type StockData = {
  symbol: string;
  name: string;
}

export function normalizeMonthlyCloses(raw: any): NormalizedMonthlyCloseSeries {
  const meta = raw?.["Meta Data"] ?? {};
  const symbol = String(meta?.["2. Symbol"] ?? "");
  const lastRefreshed = String(meta?.["3. Last Refreshed"] ?? "");
  const timeZone = meta?.["4. Time Zone"] ? String(meta["4. Time Zone"]) : undefined;

  const seriesObj = raw?.["Monthly Time Series"] ?? {};

  // Convert object -> array
  const points: MonthlyClosePoint[] = Object.entries(seriesObj)
    .map(([date, ohlc]: [string, any]) => {
      const closeStr = ohlc?.["4. close"];
      const close = Number(closeStr);
      return {
        date,
        close: Number.isFinite(close) ? close : NaN,
      };
    })
    .filter((p) => p.date && Number.isFinite(p.close))
    // IMPORTANT: sort for charting (oldest -> newest)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    symbol,
    lastRefreshed,
    timeZone,
    points,
  };
}

export function toChartPoints(points: MonthlyClosePoint[]){
  return points.map(p => ({
    x: new Date(p.date),  // Date object
    y: p.close,
  }));
}

export default function Chart() {
    let [chartData, setChartData] = useState<PointShape[]>([]);
    let [stockData] = useState<StockData[]>([]);
    const stockTickers = ['IBM', 'MSFT', 'BA', 'AAPL'];

    function getUrl(ticker: string){
      return `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${ticker}&apikey=demo`
    }

    useEffect(() => {
      const getMonthlyStockPrices = async () => {
        const url = 'https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=MSFT&apikey=demo';
        const stockPrice = {
            method: 'GET',
            headers: {
                'User-Agent': 'request'
            }
        }
        const url2 = 'https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=IBM&apikey=demo';
        const stockPrice2 = {
            method: 'GET',
            headers: {
                'User-Agent': 'request'
            }
        }
        try {
            const response = await fetch(url, stockPrice);
            const result = await response.json();
            console.log(result);
            const normalized = normalizeMonthlyCloses(result);

            const response2 = await fetch(url2, stockPrice2);
            const result2 = await response2.json();
            const normalized2 = normalizeMonthlyCloses(result2);

            const nextData2: PointShape[] = normalized2.points.map(p => ({
              value: Number(p.close)
            }));

            setChartData(nextData2);

            console.log(normalized.symbol);           // "IBM"
            console.log(normalized.points.at(-1));    // latest close point
            console.log(normalized.points.slice(-5)); // last 5 months
            const nextData: PointShape[] = normalized.points.map(p => ({
                value: Number(p.close),
            }));

            setChartData(nextData);
            console.log(chartData)
        } catch(error) {
            console.error(error);
        }
      };
      getMonthlyStockPrices();
    }, [])

    // async function getMonthlyStockPrices(){

    //     const url = 'https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=IBM&apikey=demo';
    //     const stockPrice = {
    //         method: 'GET',
    //         headers: {
    //             'User-Agent': 'request'
    //         }
    //     }
    //     try {
    //         const response = await fetch(url, stockPrice);
    //         const result = await response.json();
    //         console.log(result)
    //         const normalized = normalizeMonthlyCloses(result);

    //         console.log(normalized.symbol);           // "IBM"
    //         console.log(normalized.points.at(-1));    // latest close point
    //         console.log(normalized.points.slice(-5)); // last 5 months
    //         const nextData: PointShape[] = normalized.points.map(p => ({
    //             value: Number(p.close),
    //         }));

    //         setChartData(nextData);
    //         console.log(chartData)
    //     } catch(error) {
    //         console.error(error);
    //     }
    // }

    async function getTickers(){
        try {
            const url = 'https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=demo'
            const stockTickers = {
                method: 'GET',
                headers: {
                    'User-Agent': 'request'
                }
            }
            const response = await fetch(url, stockTickers);
            const result = await response.text();
            parseStockData(result);
            //const stockData: Array<any> = Array(result);
            //console.log(stockData)
            //const parseStockData = result?.slice(0, result?.indexOf(",", 15));
            //const parseStock = result?.slice(127, result?.indexOf(",", 330));
            // console.log(parseStockData);
            //console.log(parseStock.split(","));
            //console.log(result);
        } catch(error) {
            console.error(error)
        }
    }

    function parseStockData(data: string){
      const splitData = data.split(",");
      let initialData: StockData = { symbol: splitData[0], name: splitData[1] }
      stockData.push(initialData);

      for(let temp of splitData) {
        if (temp.includes("Active")) {
          const extractedTicker = temp.slice(6, temp.length);
          const extractedName = splitData[((splitData.indexOf(temp)) + 1)];

          stockData.push({
            symbol: extractedTicker,
            name: extractedName
          })
        }
      }
    }

    async function renderItem({ item }: any) {

    }

  return (
    <View style={styles.container}>
        <Text style={{color: '#fff', position: 'absolute', left: '5%'}}>Stocks</Text>
        {/* <TouchableOpacity onPress={getMonthlyStockPrices}>
            <Text style={{color: 'green'}}>Press Me</Text>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={getTickers}>
            <Text style={{color: 'green'}}>Press Me</Text>
        </TouchableOpacity>
        <FlatList 
            style={{ position: 'absolute', left: '0%', top: '10%' }}
            data={stockTickers}
            renderItem={({item}) => {
                return (
                    <View style={{ borderRadius: 8, borderTopRightRadius: 8, margin: 50, borderBottomWidth: 0.5, borderBottomColor: 'grey', backgroundColor: 'green', flexDirection: 'row', minWidth: '100%' }}>
                      <View>
                        <Text>{item}</Text>
                        <Text>Official Stock Name</Text>
                      </View>
                      <View style={{ position: 'absolute', top: 0 }}>
                      <LineChart
                        hideAxesAndRules
                        areaChart1
                        data={chartData}
                        spacing={5}
                        thickness={2}
                        hideRules
                        yAxisColor="#0BA5A4"
                        // showVerticalLines
                        verticalLinesColor="rgba(14,164,164,0.5)"
                        xAxisColor="#0BA5A4"
                        color="#0BA5A4"
                        yAxisTextStyle={{          // ✅ Y-axis numbers
                            color: '#0BA5A4',
                            fontSize: 12,
                        }}

                        // ✅ THIS enables dots/points:
                        showDataPointOnFocus
                        dataPointsHeight={8}
                        dataPointsWidth={8}
                        dataPointsRadius={4}
                        dataPointsColor="#0BA5A4"
                        startFillColor="rgb(46, 217, 255)"
                        startOpacity={0.8}
                        endFillColor="rgb(203, 241, 250)"
                        endOpacity={0.3}
                        focusEnabled
                    />
                    </View>
                  </View>
                );
            }}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    // justifyContent: 'center',
    backgroundColor: '#0B0D10'
  }
});