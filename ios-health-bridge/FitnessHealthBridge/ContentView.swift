import SwiftUI

struct ContentView: View {
    @StateObject private var health = HealthKitManager()
    @AppStorage("serverURL") private var serverURL = "https://YOUR-SITE.netlify.app"
    @AppStorage("userId") private var userId = ""
    @State private var syncToken = ""
    @State private var message = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Pairing") {
                    TextField("Netlify site URL", text: $serverURL).textInputAutocapitalization(.never).keyboardType(.URL)
                    TextField("User ID", text: $userId).textInputAutocapitalization(.never)
                    SecureField("One-time sync token", text: $syncToken)
                }
                Section("Health") {
                    Button("Authorize Apple Health") {
                        Task { do { try await health.requestAuthorization(); message = health.status } catch { message = error.localizedDescription } }
                    }
                    Button("Sync last 42 days") {
                        Task {
                            do {
                                let samples = try await health.fetchLast(days: 42)
                                let imported = try await SyncService().upload(samples: samples, baseURL: serverURL, userId: userId, token: syncToken)
                                message = "Imported \(imported) samples"
                            } catch { message = error.localizedDescription }
                        }
                    }
                }
                if !message.isEmpty { Section("Status") { Text(message) } }
            }
            .navigationTitle("Fitness Health Bridge")
        }
    }
}
