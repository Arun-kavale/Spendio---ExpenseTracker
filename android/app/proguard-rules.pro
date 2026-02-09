# Add project specific ProGuard rules here.

# React Native
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Google Sign-In
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
