// Holds "who is logged in" for the whole app. The router listens to this,
// so any change here (login, logout, approval) moves the user to the right screen.
import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../core/api/token_store.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

enum AuthStatus {
  restoring, // app just started; checking for a saved session
  signedOut,
  signedIn,
}

class AuthProvider extends ChangeNotifier {
  AuthProvider(this._api, this._service, this._store) {
    // If any request comes back 401, the session is over.
    _api.onUnauthorized = () => logout(expired: true);
  }

  final ApiClient _api;
  final AuthService _service;
  final TokenStore _store;

  AuthStatus status = AuthStatus.restoring;
  AppUser? user;

  /// Set when the session ended on its own, so the login screen can say why.
  bool sessionExpired = false;

  /// Called once at start-up: reuse a saved token if it still works.
  Future<void> restore() async {
    final saved = await _store.read();
    if (saved == null) {
      status = AuthStatus.signedOut;
      notifyListeners();
      return;
    }
    _api.token = saved;
    try {
      user = await _service.me();
      status = AuthStatus.signedIn;
    } on ApiException catch (e) {
      // 401 = token is dead: forget it. Any other failure (server offline)
      // also lands on the login screen, but keeps the token for next time.
      if (e.statusCode == 401) await _store.clear();
      _api.token = null;
      user = null;
      status = AuthStatus.signedOut;
    }
    notifyListeners();
  }

  /// Throws ApiException with a readable message on failure.
  Future<void> login(String email, String password) async {
    await _start(await _service.login(email, password));
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required UserRole role,
    required String phone,
    String organization = '',
  }) async {
    await _start(await _service.register(
      name: name,
      email: email,
      password: password,
      role: role,
      phone: phone,
      organization: organization,
    ));
  }

  Future<void> _start(AuthSession session) async {
    _api.token = session.token;
    await _store.write(session.token);
    user = session.user;
    sessionExpired = false;
    status = AuthStatus.signedIn;
    notifyListeners();
  }

  /// Re-reads the account. Used on the "waiting for approval" screen.
  Future<void> refreshUser() async {
    user = await _service.me();
    notifyListeners();
  }

  Future<void> logout({bool expired = false}) async {
    if (status == AuthStatus.signedOut) return;
    _api.token = null;
    user = null;
    sessionExpired = expired;
    status = AuthStatus.signedOut;
    notifyListeners();
    await _store.clear();
  }
}
