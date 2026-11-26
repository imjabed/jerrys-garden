package com.jamebouquets.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.*;
import android.widget.*;

public class MainActivity extends Activity {
    private static final String HOME = "https://jamebouquets.vercel.app/";
    private WebView web;
    private LinearLayout error;
    private ProgressBar progress;
    private String retryUrl = HOME;

    private boolean trusted(Uri uri) {
        return "https".equalsIgnoreCase(uri.getScheme()) && "jamebouquets.vercel.app".equalsIgnoreCase(uri.getHost()) && (uri.getPort() == -1 || uri.getPort() == 443);
    }
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);
        root.setOnApplyWindowInsetsListener((v, i) -> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = i.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                v.setPadding(i.getSystemWindowInsetLeft(), i.getSystemWindowInsetTop(), i.getSystemWindowInsetRight(), i.getSystemWindowInsetBottom());
            }
            return i;
        });
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(-1,-1));
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        root.addView(progress, new FrameLayout.LayoutParams(-1, 8));
        error = new LinearLayout(this);
        error.setOrientation(LinearLayout.VERTICAL);
        error.setGravity(android.view.Gravity.CENTER);
        error.setPadding(32,32,32,32);
        error.setBackgroundColor(Color.WHITE);
        TextView message = new TextView(this);
        message.setText("Unable to load Jame Bouquets. Check your internet connection and try again.");
        message.setGravity(android.view.Gravity.CENTER);
        message.setTextSize(17);
        error.addView(message);
        Button retry = new Button(this);
        retry.setText("Try again");
        retry.setOnClickListener(v -> { error.setVisibility(View.GONE); web.loadUrl(retryUrl); });
        error.addView(retry);
        error.setVisibility(View.GONE);
        root.addView(error, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        root.requestApplyInsets();
        WebSettings s = web.getSettings();
        s.setUserAgentString(s.getUserAgentString() + " JameBouquetsAndroid/1.1");
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportMultipleWindows(false);
        if (android.os.Build.VERSION.SDK_INT >= 24) {
            ServiceWorkerController.getInstance().getServiceWorkerWebSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
            ServiceWorkerController.getInstance().getServiceWorkerWebSettings().setAllowFileAccess(false);
            ServiceWorkerController.getInstance().getServiceWorkerWebSettings().setAllowContentAccess(false);
        }
        CookieManager.getInstance().setAcceptCookie(true);
        // Storefront and its authenticated Render API are on different HTTPS sites.
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
        WebView.setWebContentsDebuggingEnabled(false);
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) {
                progress.setProgress(value);
                progress.setVisibility(value == 100 ? View.GONE : View.VISIBLE);
            }
        });
        web.setWebViewClient(new WebViewClient() {
            private boolean route(Uri uri) {
                if (trusted(uri)) return false;
                String scheme = uri.getScheme();
                if ("https".equalsIgnoreCase(scheme) || "mailto".equalsIgnoreCase(scheme) || "tel".equalsIgnoreCase(scheme) || "whatsapp".equalsIgnoreCase(scheme)) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (Exception e) { Toast.makeText(MainActivity.this, "No app available for this link", Toast.LENGTH_SHORT).show(); }
                }
                return true;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) { return r.isForMainFrame() && route(r.getUrl()); }
            @Override public boolean shouldOverrideUrlLoading(WebView v, String url) { return route(Uri.parse(url)); }
            @Override public void onPageStarted(WebView v, String url, android.graphics.Bitmap icon) {
                if (trusted(Uri.parse(url))) retryUrl = url;
                error.setVisibility(View.GONE);
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) error.setVisibility(View.VISIBLE);
            }
            @Override public void onReceivedHttpError(WebView v, WebResourceRequest r, WebResourceResponse e) {
                if (r.isForMainFrame() && e.getStatusCode() >= 500) error.setVisibility(View.VISIBLE);
            }
        });
        if (saved == null || web.restoreState(saved) == null) web.loadUrl(HOME);
    }
    @Override public void onSaveInstanceState(Bundle out) { web.saveState(out); super.onSaveInstanceState(out); }
    @Override public void onBackPressed() {
        if (error.getVisibility() == View.VISIBLE) { error.setVisibility(View.GONE); web.loadUrl(HOME); }
        else if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
    @Override protected void onPause() { web.onPause(); CookieManager.getInstance().flush(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }
}
