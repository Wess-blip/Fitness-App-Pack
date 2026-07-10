import Foundation

struct HealthSamplePayload: Codable, Identifiable {
    let id: String
    let type: String
    let startAt: String
    let endAt: String?
    let value: Double
    let unit: String
    let sourceName: String?
    let sourceId: String?
    let metadata: [String: String]?
}

struct HealthImportPayload: Codable {
    let userId: String
    let samples: [HealthSamplePayload]
}
