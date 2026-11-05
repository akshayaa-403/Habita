# Keep line numbers so obfuscated crash traces can be mapped back with the
# mapping file AGP embeds in the AAB.
# CalendarPlugin needs no keep rule: Capacitor's consumer rules keep every
# @CapacitorPlugin class (node_modules/@capacitor/android/capacitor/proguard-rules.pro).
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
