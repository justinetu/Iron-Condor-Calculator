import { Tabs } from "expo-router";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarIconStyle: {
                margin: 8
            },
        }}>
            <Tabs.Screen 
                name="index"  
                options={{
                    title: 'Home',
                    headerTitle: 'Condor Calculator',
                    headerTintColor: '#fff',
                    tabBarActiveTintColor: '#1DB954',
                    tabBarIcon: ({ color }) => <FontAwesome size={25}  name="home" color={color} />,
                    headerStyle: {backgroundColor: '#0F141A'},
                    tabBarStyle: {backgroundColor: '#0F141A', borderTopWidth: 0.1, borderColor: '#fff'}
                }}
            />
            <Tabs.Screen 
                name="chart"  
                options={{
                    title: 'Chart',
                    tabBarActiveTintColor: '#1DB954',
                    tabBarIcon: ({color}) => <FontAwesome size={25} name="line-chart" color={color} />,
                    headerStyle: {backgroundColor: '#0F141A'},
                    tabBarStyle: {backgroundColor: '#0F141A', borderTopWidth: 0.1, borderColor: '#fff'},
                    headerTintColor: '#fff',
                }}
            />
            <Tabs.Screen 
                name="summary"  
                options={{
                    title: 'Summary',
                    tabBarActiveTintColor: '#1DB954',
                    tabBarIcon: ({color}) => <FontAwesome size={25} name="sticky-note" color={color} />,
                    headerStyle: {backgroundColor: '#0F141A'},
                    tabBarStyle: {backgroundColor: '#0F141A', borderTopWidth: 0.1, borderColor: '#fff'},
                    headerTintColor: '#fff',
                }}
            />
        </Tabs>
    );
}