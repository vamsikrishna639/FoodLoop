// All routes, plus the rules that decide who may see what.
//
// The redirect function runs before every navigation and again whenever
// AuthProvider changes (login, logout, approval), so users are always moved
// to the correct place without each screen having to check.
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../screens/auth/login_screen.dart';
import '../../screens/auth/pending_screen.dart';
import '../../screens/auth/register_screen.dart';
import '../../screens/common/coming_soon_screen.dart';
import '../../screens/common/gallery_screen.dart';
import '../../screens/common/profile_screen.dart';
import '../../screens/common/splash_screen.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/responsive_shell.dart';
import '../../widgets/slip_snackbar.dart';
import '../theme/tokens.dart';

/// Pages each role may open inside the shell. Anything else goes to /home.
const Map<UserRole, Set<String>> _allowed = {
  UserRole.recipient: {'/home', '/requests', '/notifications', '/profile'},
  UserRole.donor: {'/home', '/listings', '/notifications', '/profile'},
  UserRole.volunteer: {'/home', '/notifications', '/profile'},
  UserRole.admin: {'/home', '/approvals', '/listings', '/notifications', '/profile'},
};

/// The navigation shown to each role.
List<ShellDestination> destinationsFor(UserRole role) => switch (role) {
      UserRole.recipient => const [
          ShellDestination(label: 'Counter', icon: Icons.storefront_outlined, path: '/home'),
          ShellDestination(label: 'Requests', icon: Icons.receipt_long_outlined, path: '/requests'),
          ShellDestination(label: 'Alerts', icon: Icons.notifications_outlined, path: '/notifications'),
          ShellDestination(label: 'Profile', icon: Icons.person_outline, path: '/profile'),
        ],
      UserRole.donor => const [
          ShellDestination(label: 'Board', icon: Icons.dashboard_outlined, path: '/home'),
          ShellDestination(label: 'Listings', icon: Icons.confirmation_number_outlined, path: '/listings'),
          ShellDestination(label: 'Alerts', icon: Icons.notifications_outlined, path: '/notifications'),
          ShellDestination(label: 'Profile', icon: Icons.person_outline, path: '/profile'),
        ],
      UserRole.volunteer => const [
          ShellDestination(label: 'Pickups', icon: Icons.pedal_bike_outlined, path: '/home'),
          ShellDestination(label: 'Alerts', icon: Icons.notifications_outlined, path: '/notifications'),
          ShellDestination(label: 'Profile', icon: Icons.person_outline, path: '/profile'),
        ],
      UserRole.admin => const [
          ShellDestination(label: 'Overview', icon: Icons.insights_outlined, path: '/home'),
          ShellDestination(label: 'Approvals', icon: Icons.how_to_reg_outlined, path: '/approvals'),
          ShellDestination(label: 'Listings', icon: Icons.confirmation_number_outlined, path: '/listings'),
          ShellDestination(label: 'Alerts', icon: Icons.notifications_outlined, path: '/notifications'),
          ShellDestination(label: 'Profile', icon: Icons.person_outline, path: '/profile'),
        ],
    };

GoRouter buildRouter(AuthProvider auth) {
  return GoRouter(
    initialLocation: '/home',
    refreshListenable: auth,
    redirect: (context, state) {
      final path = state.matchedLocation;

      // The gallery is open to everyone, signed in or not.
      if (path == '/gallery') return null;

      switch (auth.status) {
        case AuthStatus.restoring:
          // Wait on the splash screen while the saved session is checked, and
          // remember the page that was asked for (e.g. after a browser
          // refresh on /profile) so the user can be sent back to it.
          if (path == '/splash') return null;
          return Uri(path: '/splash', queryParameters: {'from': state.uri.toString()}).toString();

        case AuthStatus.signedOut:
          return (path == '/login' || path == '/register') ? null : '/login';

        case AuthStatus.signedIn:
          final user = auth.user!;
          // Pending and rejected accounts only ever see the waiting screen.
          if (!user.isApproved) return path == '/pending' ? null : '/pending';
          // Session restored: go back to the page that was asked for. The
          // redirect runs again on that page, so the role check below still
          // applies to it.
          if (path == '/splash') {
            final from = state.uri.queryParameters['from'];
            if (from != null && from.startsWith('/') && !from.startsWith('/splash')) return from;
            return '/home';
          }
          // Approved users have no business on the entry screens.
          if (const {'/login', '/register', '/pending'}.contains(path)) return '/home';
          // Role-based access: e.g. a recipient typing /approvals goes home.
          if (!_allowed[user.role]!.contains(path)) return '/home';
          return null;
      }
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/login', pageBuilder: (_, s) => _fade(s, const LoginScreen())),
      GoRoute(path: '/register', pageBuilder: (_, s) => _fade(s, const RegisterScreen())),
      GoRoute(path: '/pending', pageBuilder: (_, s) => _fade(s, const PendingScreen())),
      GoRoute(path: '/gallery', builder: (_, _) => const GalleryScreen()),

      // Everything below is wrapped in the ResponsiveShell.
      ShellRoute(
        builder: (context, state, child) {
          final user = auth.user;
          if (user == null) return const SizedBox.shrink(); // mid sign-out
          return ResponsiveShell(
            user: user,
            destinations: destinationsFor(user.role),
            currentPath: state.matchedLocation,
            onNavigate: (path) => context.go(path),
            action: _actionFor(context, user.role),
            activityRail: const ActivityRailPlaceholder(),
            child: child,
          );
        },
        routes: [
          GoRoute(path: '/home', pageBuilder: (_, s) => _fade(s, _HomeForRole(auth: auth))),
          GoRoute(
            path: '/requests',
            pageBuilder: (_, s) => _fade(
              s,
              const ComingSoonScreen(
                title: 'My requests',
                heading: 'No receipts yet',
                message: 'Each request you make will be kept here as a receipt. Built in Stage 3.',
                art: EmptyArt.plate,
              ),
            ),
          ),
          GoRoute(
            path: '/listings',
            pageBuilder: (_, s) => _fade(
              s,
              const ComingSoonScreen(
                title: 'Listings',
                heading: 'No tokens printed yet',
                message: 'Posted food will be listed here as token slips. Built in Stage 2.',
                art: EmptyArt.slip,
              ),
            ),
          ),
          GoRoute(
            path: '/approvals',
            pageBuilder: (_, s) => _fade(
              s,
              const ComingSoonScreen(
                title: 'Approvals',
                heading: 'The queue opens soon',
                message: 'New accounts waiting for a decision will appear here. Built in Stage 4.',
                art: EmptyArt.clock,
              ),
            ),
          ),
          GoRoute(
            path: '/notifications',
            pageBuilder: (_, s) => _fade(
              s,
              const ComingSoonScreen(
                title: 'Alerts',
                heading: 'Nothing to tell you yet',
                message: 'Approvals, pickups and deliveries will be announced here. Built in Stage 4.',
                art: EmptyArt.slip,
              ),
            ),
          ),
          GoRoute(path: '/profile', pageBuilder: (_, s) => _fade(s, const ProfileScreen())),
        ],
      ),
    ],
  );
}

/// A short cross-fade between pages. Under reduced motion it is instant.
CustomTransitionPage<void> _fade(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionDuration: FlMotion.base,
    reverseTransitionDuration: FlMotion.fast,
    transitionsBuilder: (context, animation, _, child) {
      if (FlMotion.reduced(context)) return child;
      return FadeTransition(
        opacity: CurvedAnimation(parent: animation, curve: FlMotion.easeOut),
        child: child,
      );
    },
  );
}

/// The raised centre action on mobile / the red button in the sidebar.
ShellAction? _actionFor(BuildContext context, UserRole role) => switch (role) {
      UserRole.donor => ShellAction(
          label: 'Post food',
          icon: Icons.add,
          onTap: () => showSlip(context, 'Posting food is built in Stage 2.', note: true),
        ),
      UserRole.recipient => ShellAction(
          label: 'Browse',
          icon: Icons.search,
          onTap: () => context.go('/home'),
        ),
      _ => null,
    };

/// Stage 1 home: a different stand-in per role. Replaced in Stages 2-4.
class _HomeForRole extends StatelessWidget {
  const _HomeForRole({required this.auth});
  final AuthProvider auth;

  @override
  Widget build(BuildContext context) {
    return switch (auth.user?.role) {
      UserRole.donor => const ComingSoonScreen(
          title: "Today's Surplus",
          heading: 'The board is blank',
          message: 'Your chalkboard of posted food and incoming requests is built in Stage 2.',
          art: EmptyArt.slip,
        ),
      UserRole.volunteer => const ComingSoonScreen(
          title: 'Pickups',
          heading: 'No runs assigned',
          message: 'Pickups an admin assigns to you will appear here. Built in Stage 4.',
          art: EmptyArt.clock,
        ),
      UserRole.admin => const ComingSoonScreen(
          title: 'Overview',
          heading: 'Numbers come later',
          message: 'Impact figures, the deliveries chart and approvals are built in Stage 4.',
          art: EmptyArt.plate,
        ),
      _ => const ComingSoonScreen(
          title: "Today's Counter",
          heading: "The counter's clear",
          message: 'Food on offer will be laid out here as token slips. Built in Stage 2.',
        ),
    };
  }
}
