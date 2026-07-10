import Foundation

struct SyncService {
    func upload(samples: [HealthSamplePayload], baseURL: String, userId: String, token: String) async throws -> Int {
        guard !userId.isEmpty, !token.isEmpty else { throw BridgeError.missingPairing }
        guard let url = URL(string: baseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + "/api/health/import") else { throw BridgeError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(token, forHTTPHeaderField: "x-health-sync-token")
        request.httpBody = try JSONEncoder().encode(HealthImportPayload(userId: userId, samples: samples))
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            print(String(data: data, encoding: .utf8) ?? "")
            throw BridgeError.badResponse
        }
        let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        return object?["imported"] as? Int ?? samples.count
    }
}
