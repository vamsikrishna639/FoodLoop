// FoodLoop - app entry point.
// Creates the shared objects (API client, providers, router) and starts the UI.
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import 'core/api/api_client.dart';
import 'core/api/token_store.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'services/auth_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // One API client for the whole app, so the token is set in one place.
  final api = ApiClient();
  final auth = AuthProvider(api, AuthService(api), TokenStore());
  final theme = ThemeProvider();

  // Start both in the background; the splash screen shows until auth is known.
  theme.load();
  auth.restore();

  runApp(FoodLoopApp(api: api, auth: auth, theme: theme));
}

class FoodLoopApp extends StatefulWidget {
  const FoodLoopApp({super.key, required this.api, required this.auth, required this.theme});

  final ApiClient api;
  final AuthProvider auth;
  final ThemeProvider theme;

  @override
  State<FoodLoopApp> createState() => _FoodLoopAppState();
}

class _FoodLoopAppState extends State<FoodLoopApp> {
  // Built once: rebuilding the router would throw away the navigation state.
  late final GoRouter _router = buildRouter(widget.auth);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: widget.api),
        ChangeNotifierProvider<AuthProvider>.value(value: widget.auth),
        ChangeNotifierProvider<ThemeProvider>.value(value: widget.theme),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, theme, _) => MaterialApp.router(
          title: 'FoodLoop',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.paper,
          darkTheme: AppTheme.chalkboard,
          themeMode: theme.mode,
          routerConfig: _router,
        ),
      ),
    );
  }
}
