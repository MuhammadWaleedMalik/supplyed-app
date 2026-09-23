type Tokens = {
  accessToken?: string;
  refreshToken?: string;
  tokens?: { accessToken?: string; refreshToken?: string };
};

let accessToken = '';
let refreshToken = '';

export function saveTokens(result: Tokens) {
  accessToken = result.accessToken || result.tokens?.accessToken || '';
  refreshToken =
    result.refreshToken || result.tokens?.refreshToken || refreshToken;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function clearTokens() {
  accessToken = '';
  refreshToken = '';
}
