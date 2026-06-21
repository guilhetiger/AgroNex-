import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage?: string;
  errorStack?: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: any) {
    console.error(error, info);
    this.setState({ errorMessage: error.message, errorStack: error.stack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>AgroNex encontró un problema</Text>
          <Text style={styles.text}>Cierra y vuelve a abrir la app. Si continúa, copia el error y pégalo en el chat.</Text>
          {this.state.errorMessage ? (
            <Text style={styles.error} selectable>
              {this.state.errorMessage}
            </Text>
          ) : null}
          {this.state.errorStack ? (
            <Text style={styles.stack} selectable>
              {this.state.errorStack}
            </Text>
          ) : null}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#030712',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  text: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  error: {
    marginTop: 12,
    color: '#F87171',
    fontSize: 14,
    textAlign: 'left',
  },
  stack: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'left',
  },
});
