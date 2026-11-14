// FoodLoop - app entry point.
// Creates the shared objects (API client, services, providers, router) and
// starts the UI.
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import 'core/api/api_client.dart';
import 'core/api/token_store.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/feed_provider.dart';
import 'providers/listings_provider.dart';
import 'providers/theme_provider.dart';
import 'services/auth_service.dart';
import 'services/food_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // One API client for the whole app, so the token is set in one place.
  final api = ApiClient();
  final auth = AuthProvider(api, AuthService(api), TokenStore());
  final theme = ThemeProvider();
  final foods = FoodService(api);
  final feed = FeedProvider(foods);
  final listings = ListingsProvider(foods);

  // On sign-out, forget the previous user's lists so the next user never
  // sees them, even for a moment.
  auth.addListener(() {
    if (auth.status == AuthStatus.signedOut) {
      feed.reset();
      listings.reset();
    }
  });

  // Start both in the background; the splash screen shows until auth is known.
  theme.load();
  auth.restore();

  runApp(FoodLoopApp(api: api, auth: auth, theme: theme, foods: foods, feed: feed, listings: listings));
}

class FoodLoopApp extends StatefulWidget {
  const FoodLoopApp({
    super.key,
    required this.api,
    required this.auth,
    required this.theme,
    required this.foods,
    required this.feed,
    required this.listings,
  });

  final ApiClient api;
  final AuthProvider auth;
  final ThemeProvider theme;
  final FoodService foods;
  final FeedProvider feed;
  final ListingsProvider listings;

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
        Provider<FoodService>.value(value: widget.foods),
        ChangeNotifierProvider<AuthProvider>.value(value: widget.auth),
        ChangeNotifierProvider<ThemeProvider>.value(value: widget.theme),
        ChangeNotifierProvider<FeedProvider>.value(value: widget.feed),
        ChangeNotifierProvider<ListingsProvider>.value(value: widget.listings),
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
