import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Entypo } from '@react-native-vector-icons/entypo';
import { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";;
import { RootStackParamList } from '../types';

type StockRow = {
  symbol: string;
  name: string;
  lastSale: number;
  netChange: number;
  pctChange: number;
  marketCap: number;
};

type ApiRow = {
  symbol: string;
  name: string;
  lastsale: string;
  netchange: string;
  pctchange: string;
  marketCap: string;
};

type ApiResponse = {
  meta: any;
  body: ApiRow[];
};

///////////////

type NormalizedOptionMeta = {
  ticker: string;
  requestedExpirationSec: number | null;  // from meta.expiration
  processedTimeISO: string;
};

type NormalizedUnderlyingQuote = {
  symbol: string;
  shortName?: string;
  longName?: string;
  currency?: string;

  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;

  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;

  marketCap?: number;

  marketTimeISO?: string;       // converted from regularMarketTime seconds
  postMarketTimeISO?: string;   // converted from postMarketTime seconds
};

type NormalizedOptionsOverview = {
  underlyingSymbol: string;
  hasMiniOptions: boolean;

  expirationDatesSec: number[];
  expirationDatesISO: string[];     // same list, but human-readable
  nearestExpirationSec: number | null;
  nearestExpirationISO: string | null;

  // These may be empty depending on endpoint/plan/data:
  strikes: number[];
};

type NormalizedOptionsPayload = {
  meta: NormalizedOptionMeta;
  overview: NormalizedOptionsOverview;
  quote: NormalizedUnderlyingQuote;
};

////////

type PolygonContractsResponse = {
  results?: Array<{
    ticker?: string;              // option contract ticker/symbol
    contract_type?: "call" | "put";
    expiration_date?: string;     // YYYY-MM-DD
    strike_price?: number;
    underlying_ticker?: string;
    shares_per_contract?: number;
  }>;
  next_url?: string;
};

// delete below

// type OptionContract = {
//   ticker: string;
//   underlying_ticker: string;
//   expiration_date: string;
//   strike_price: number;
//   contract_type: "call" | "put";
//   shares_per_contract: number;
// };

// type OptionsContractsResponse = {
//   results: OptionContract[];
//   next_url?: string;
// };

const POLYGON_API_KEY = 'KXCJpizGJ2RT8ou3qIZJpYnzlV6Yjsln';

function unixSecToYYYYMMDD(sec: number): string {
  // Convert 1731628800 -> "2024-11-14" style (UTC)
  const d = new Date(sec * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// async function fetchAllOptionContractsByExpiration(
//   underlying: string,
//   expirationDateYYYYMMDD: string
// ): Promise<OptionContract[]> {
//   const params = new URLSearchParams({
//     underlying_ticker: underlying,
//     expiration_date: expirationDateYYYYMMDD,
//     order: "asc",
//     sort: "strike_price",
//     limit: "10",
//     apiKey: POLYGON_API_KEY as string,
//   }); 
  
//   // First page
//   let url =
//     `https://api.massive.com/v3/reference/options/contracts?${params.toString()}`
//     // `https://api.polygon.io/v3/reference/options/contracts` +
//     // `?underlying_ticker=${encodeURIComponent(underlying)}` +
//     // `&expiration_date=${encodeURIComponent(expirationDateYYYYMMDD)}` +
//     // `&limit=1000` +
//     // `&apiKey=${encodeURIComponent(POLYGON_API_KEY)}`;
    

//   const all: NonNullable<PolygonContractsResponse["results"]> = [];

//   const res = await fetch(url);
//   const text = await res.text();

//   if (!res.ok) {
//     throw new Error(`HTTP ${res.status}: ${text}`);
//   }

//   const data: OptionsContractsResponse = JSON.parse(text);
//   return data.results ?? [];
// }

// export async function getStrikesFromPolygonContracts(
//   underlying: string,
//   expirationSec: number
// ) {
//   const expirationDate = unixSecToYYYYMMDD(expirationSec);
//   const contracts = await fetchAllOptionContractsByExpiration(underlying, expirationDate);

//   const strikeSet = new Set<number>();
//   for (const c of contracts) {
//     if (typeof c.strike_price === "number") strikeSet.add(c.strike_price);
//   }

//   const strikes = Array.from(strikeSet).sort((a, b) => a - b);
//   // Optional: structure for rendering a chain
//   const callsByStrike = new Map<number, any[]>();
//   const putsByStrike = new Map<number, any[]>();

//   for (const c of contracts) {
//     if (typeof c.strike_price !== "number") continue;
//     if (c.contract_type === "call") {
//       const arr = callsByStrike.get(c.strike_price) ?? [];
//       arr.push(c);
//       callsByStrike.set(c.strike_price, arr);
//     } else if (c.contract_type === "put") {
//       const arr = putsByStrike.get(c.strike_price) ?? [];
//       arr.push(c);
//       putsByStrike.set(c.strike_price, arr);
//     }
//   }

//   return {
//     expirationDateYYYYMMDD: expirationDate,
//     strikes,
//     contracts,
//     callsByStrike,
//     putsByStrike,
//   };
// }


///////

export default  function Home() {
  const BASE_URL = 'https://api.massive.com';

  const API_KEY = 'KXCJpizGJ2RT8ou3qIZJpYnzlV6Yjsln';
  const BASE = "https://api.massive.com";

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [rows, setRows] = useState<StockRow[]>([]);
  const [q, setQ] = useState("");
  const [isSearchingStocks, setIsSearchingStocks] = useState<boolean>(false);
  const [isStockSelected, setStockIsSelected] = useState<boolean>(false);
  let [displayedStock, setDisplayedStock] = useState<StockRow>({
    symbol: "",
    name: "",
    lastSale: 0,
    netChange: 0,
    pctChange: 0,
    marketCap: 0
  })

  async function getData(){
    setIsSearchingStocks(true);
    setStockIsSelected(false);

    const optionUrl = 'https://yahoo-finance15.p.rapidapi.com/api/v1/markets/options?expiration=1731628800&ticker=AAPL&';
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': 'b5a2778267mshd7408a459662228p1d985ejsnc55c695f8294',
        'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
      }
    };

    try {
      const response = await fetch(optionUrl, options);
      const result = await response.json();
      const normalized = normalizeOptionsLikePayload(result);

      

        } catch (error) {
          console.error(error);
        }

    ////////////

    const url = 'https://yahoo-finance15.p.rapidapi.com/api/v2/markets/tickers?page=1&type=STOCKS';
    const tickers = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': 'b5a2778267mshd7408a459662228p1d985ejsnc55c695f8294',
        'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
      }
    };

    try {
      const response = await fetch(url, tickers);
      const payload = await response.json();
      setRows(normalizeStocksPaylod(payload))
      //console.log(rows);


    } catch (error) {
      console.error(error);
    }

    // const { strikes, expirationDateYYYYMMDD } =
    //   await getStrikesFromPolygonContracts("AAPL", 1731628800);

    // console.log(expirationDateYYYYMMDD);
    // console.log("strikes count:", strikes.length);
    // console.log("first 10 strikes:", strikes.slice(0, 10));
  }


  const filtered = useMemo(() => search(rows, q) , [rows, q]);

  const parseMoney = (s: string): number =>
  Number(s.replace(/\$/g, "").replace(/,/g, "").trim());

  const parseNumber = (s: string): number =>
    Number(s.replace(/,/g, "").trim());

  const parsePercent = (s: string): number =>
    Number(s.replace(/%/g, "").trim());

  function normalizeStocksPaylod(payload: ApiResponse){
    return payload.body.map((r) => ({
      symbol: r.symbol,
      name: r.name,
      lastSale: parseMoney(r.lastsale),
      netChange: Number(r.netchange),
      pctChange: parsePercent(r.pctchange),
      marketCap: parseNumber(r.marketCap)
    }));
  }

  function search(rows: StockRow[], q: string) {
  const query = q.trim().toLowerCase();
  return rows.filter(r =>
    r.symbol.toLowerCase().includes(query) ||
    r.name.toLowerCase().includes(query)
  );
}

function handleBlur(){
  if (isStockSelected) {
    setIsSearchingStocks(false);
  }
}

const toInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const secToISO = (sec: number | null | undefined): string | null => {
  if (!sec || !Number.isFinite(sec)) return null;
  return new Date(sec * 1000).toISOString();
};

const safeNumber = (v: any): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

function normalizeOptionsLikePayload(raw: any): NormalizedOptionsPayload {
  const meta = raw?.meta ?? {};
  const body0 = raw?.body?.[0] ?? {};
  const quote = body0?.quote ?? {};

  const requestedExpirationSec = toInt(meta.expiration);

  const expirationDatesSec: number[] = Array.isArray(body0.expirationDates)
    ? body0.expirationDates.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n))
    : [];

  // Sort so “nearest” is deterministic
  expirationDatesSec.sort((a, b) => a - b);

  const nowSec = Math.floor(Date.now() / 1000);
  const nearestExpirationSec =
    expirationDatesSec.find((t) => t >= nowSec) ?? (expirationDatesSec[0] ?? null);

  const strikes: number[] = Array.isArray(body0.strikes)
    ? body0.strikes.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n))
    : [];

  const normalized: NormalizedOptionsPayload = {
    meta: {
      ticker: String(meta.ticker ?? quote.symbol ?? body0.underlyingSymbol ?? ""),
      requestedExpirationSec,
      processedTimeISO: String(meta.processedTime ?? ""),
    },

    overview: {
      underlyingSymbol: String(body0.underlyingSymbol ?? quote.symbol ?? ""),
      hasMiniOptions: Boolean(body0.hasMiniOptions),

      expirationDatesSec,
      expirationDatesISO: expirationDatesSec.map((s) => secToISO(s)!).filter(Boolean),
      nearestExpirationSec,
      nearestExpirationISO: secToISO(nearestExpirationSec),

      strikes,
    },

    quote: {
      symbol: String(quote.symbol ?? body0.underlyingSymbol ?? ""),
      shortName: quote.shortName ? String(quote.shortName) : undefined,
      longName: quote.longName ? String(quote.longName) : undefined,
      currency: quote.currency ? String(quote.currency) : undefined,

      regularMarketPrice: safeNumber(quote.regularMarketPrice),
      regularMarketChange: safeNumber(quote.regularMarketChange),
      regularMarketChangePercent: safeNumber(quote.regularMarketChangePercent),
      regularMarketVolume: safeNumber(quote.regularMarketVolume),

      bid: safeNumber(quote.bid),
      ask: safeNumber(quote.ask),
      bidSize: safeNumber(quote.bidSize),
      askSize: safeNumber(quote.askSize),

      marketCap: safeNumber(quote.marketCap),

      marketTimeISO: secToISO(safeNumber(quote.regularMarketTime) ?? null) ?? undefined,
      postMarketTimeISO: secToISO(safeNumber(quote.postMarketTime) ?? null) ?? undefined,
    },
  };

  return normalized;
}

console.log(isStockSelected);

  return (
    <View style={styles.container}>
      <View 
        style={{
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: '#1C222B',
          borderRadius: 8
          }}
        >
        <Entypo name='magnifying-glass' size={25} color='#A1A7B3' style={styles.icon} />
        <TextInput 
          onBlur={handleBlur}
          onPress={getData}
          onChangeText={setQ}
          style={styles.searchTicker} 
          placeholder='Search ticker (e.g, SPY)'
          placeholderTextColor='#A1A7B3'
        />
      </View>
      { isSearchingStocks && !isStockSelected ? <FlatList 
        style={{ backgroundColor: '#0B0D10', minWidth: q ? '99%': 'auto' }}
        data={filtered}
        keyExtractor={(item)=> item.symbol}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => {
              const selectedItem = item;
              setStockIsSelected(true);
              setIsSearchingStocks(false);
              setDisplayedStock({
                symbol: selectedItem.symbol,
                name: selectedItem.name,
                lastSale: selectedItem.lastSale,
                netChange: selectedItem.netChange,
                pctChange: selectedItem.pctChange,
                marketCap: selectedItem.marketCap
              })
              // router.push({pathname: '/screens/stockDisplay', params: item})
            }}
            style={{ 
              paddingVertical: 10, 
              borderBottomWidth: 0.5, 
              padding: 8,
              minHeight: 70,
            }}
          >
            <Text style={{ fontWeight: "700", color: '#fff' }}>
              {item.symbol} • ${item.lastSale.toFixed(2)}
            </Text>
            <Text 
              numberOfLines={1} 
              style={{ color: '#fff' }}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      /> : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
        <Text style={styles.stockTxt}>{displayedStock.symbol}</Text>
        {
          displayedStock.netChange >= 0 ?
          <Text style={styles.positive}>•  ${displayedStock.lastSale.toFixed(2)}</Text> : 
          <Text style={styles.negative}>•  ${displayedStock.lastSale.toFixed(2)}</Text>
        }
        {
          displayedStock.netChange >= 0 ?
          <Text style={styles.positive}>+{displayedStock.netChange.toFixed(2)}%</Text> : 
          <Text style={styles.negative}>{displayedStock.netChange.toFixed(2)}%</Text>
        }
      </View>
      
      { !isSearchingStocks ?
      <>
      <View style={styles.condorView}>
        <Text style={styles.cardText}>Iron Condor Setup</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
          <View style={styles.putView}>
            <View><Text style={styles.callPutTxt}>PUT SIDE</Text></View>
          </View>
          <View style={styles.callView}>
            <View><Text style={styles.callPutTxt}>CALL SIDE</Text></View>
          </View>
        </View>
      </View>
      <View style={styles.condorView}>
        <Text 
          style={[styles.cardText, 
          { borderBottomWidth: 0.5,
            borderColor: 'grey',
            padding: 8,
           }
          ]}
        >Results
        </Text>
        <View 
          style={[
            styles.resultsRow, 
            { marginBottom: 20, 
              borderBottomWidth: 0.5,
              borderBottomStartRadius: 20,
              borderBottomEndRadius: 20,
              padding: 10,
              borderColor: 'grey'
            }
            ]}>
          <Text style={styles.normalTxt}>Max Profit</Text>
          <Text style={[styles.positive, styles.maxStyle]}>$0.00</Text>
        </View>
        <View style={[
            styles.resultsRow, 
            { 
              marginBottom: 20, 
              borderBottomWidth: 0.5,
              borderBottomStartRadius: 20,
              borderBottomEndRadius: 20,
              padding: 10,
              borderColor: 'grey'
            }
            ]}>
          <Text style={[styles.normalTxt, styles.negative]}>Max Loss</Text>
          <Text style={[styles.negative, styles.maxStyle]}>-$0.00</Text>
        </View>
        <View style={[styles.resultsRow, { padding: 10 }]}>
          <Text style={styles.normalTxt}>Net Credit</Text>
          <Text style={[styles.positive, styles.maxStyle, { color: '#fff' }]}>$0.00</Text>
        </View>
      </View> </>: null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0B0D10'
  },
  maxStyle: {
    position: 'absolute',
    right: 30,
    fontSize: 25
  },
  cardText: {
    margin: 15,
    fontWeight: 'bold',
    fontSize: 20,
    color: '#fff'
  },
  searchTicker: {
    minWidth: '90%',
    minHeight: '7%',
    borderRadius: 8,
    backgroundColor: '#1C222B',
    padding: 10,
    fontSize: 15,
    color: '#fff'
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  normalTxt: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 20
  },
  icon: {
    marginLeft: 10
  },
  stockTxt: {
    fontWeight: "700", 
    color: '#fff'
  },
  positive: {
    color: '#1DB954',
    fontWeight: 'bold'
  },
  negative: {
    color: '#E04F5F',
    fontWeight: 'bold'
  },
  condorView: {
    marginTop: 30,
    backgroundColor: '#151A21',
    borderRadius: 8,
    minWidth: '100%',
    minHeight: '35%'
  },
  putView: {
    backgroundColor: '#C0392B',
    borderRadius: 5,
    minWidth: '40%',
    minHeight: '15%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  callView: {
    backgroundColor: '#3498DB',
    borderRadius: 5,
    minWidth: '40%',
    minHeight: '15%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  callPutTxt: {
    color: 'black',
    fontWeight: 'bold'
  }
});
