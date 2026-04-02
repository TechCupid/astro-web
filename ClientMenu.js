import React from "react";
import { View, StyleSheet } from "react-native";
import { Appbar, Card, Text, BottomNavigation } from "react-native-paper";

const Header = () => {
  return (
    <Appbar.Header>
      <Appbar.Action icon="menu" onPress={() => console.log("Left Menu Clicked")} />
      <Appbar.Content title="My App" />
      <Appbar.Action icon="dots-vertical" onPress={() => console.log("Right Menu Clicked")} />
    </Appbar.Header>
  );
};

const CardDetails = () => {
  return (
    <Card style={styles.card}>
      <Card.Title title="Card Title" />
      <Card.Content>
        <Text>Some details about the card go here.</Text>
      </Card.Content>
    </Card>
  );
};

const Footer = () => {
  const [index, setIndex] = React.useState(0);
  const routes = [
    { key: "home", title: "Home", icon: "home" },
    { key: "search", title: "Search", icon: "magnify" },
    { key: "notifications", title: "Alerts", icon: "bell" },
    { key: "profile", title: "Profile", icon: "account" },
  ];

  const renderScene = BottomNavigation.SceneMap({
    home: () => <Text style={styles.scene}>Home Screen</Text>,
    search: () => <Text style={styles.scene}>Search Screen</Text>,
    notifications: () => <Text style={styles.scene}>Alerts Screen</Text>,
    profile: () => <Text style={styles.scene}>Profile Screen</Text>,
  });

  return (
    <BottomNavigation 
      navigationState={{ index, routes }} 
      onIndexChange={setIndex} 
      renderScene={renderScene} 
    />
  );
};

const ClientMenu = () => {
  return (
    <View style={styles.container}>
      <Header />
      <CardDetails />
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between" },
  card: { margin: 20, padding: 10 },
  scene: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default ClientMenu;
