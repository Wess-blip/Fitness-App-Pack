import Foundation
import HealthKit

@MainActor
final class HealthKitManager: ObservableObject {
    @Published var status = "Not connected"
    private let store = HKHealthStore()
    private let iso = ISO8601DateFormatter()

    private var readTypes: Set<HKObjectType> {
        var types: Set<HKObjectType> = [HKObjectType.workoutType()]
        [HKQuantityTypeIdentifier.bodyMass, .activeEnergyBurned, .basalEnergyBurned, .stepCount].forEach {
            if let type = HKObjectType.quantityType(forIdentifier: $0) { types.insert(type) }
        }
        return types
    }

    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else { throw BridgeError.healthUnavailable }
        try await store.requestAuthorization(toShare: [], read: readTypes)
        status = "Health access requested"
    }

    func fetchLast(days: Int = 42) async throws -> [HealthSamplePayload] {
        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -days, to: end)!
        async let weight = queryQuantity(.bodyMass, unit: .gramUnit(with: .kilo), typeName: "weight", start: start, end: end)
        async let active = queryQuantity(.activeEnergyBurned, unit: .kilocalorie(), typeName: "active_energy", start: start, end: end)
        async let resting = queryQuantity(.basalEnergyBurned, unit: .kilocalorie(), typeName: "resting_energy", start: start, end: end)
        async let steps = queryQuantity(.stepCount, unit: .count(), typeName: "steps", start: start, end: end)
        async let workouts = queryWorkouts(start: start, end: end)
        return try await weight + active + resting + steps + workouts
    }

    private func queryQuantity(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit, typeName: String, start: Date, end: Date) async throws -> [HealthSamplePayload] {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { return [] }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, samples, error in
                if let error { continuation.resume(throwing: error); return }
                let payload = (samples as? [HKQuantitySample] ?? []).map { sample in
                    HealthSamplePayload(
                        id: sample.uuid.uuidString,
                        type: typeName,
                        startAt: self.iso.string(from: sample.startDate),
                        endAt: self.iso.string(from: sample.endDate),
                        value: sample.quantity.doubleValue(for: unit),
                        unit: unit.unitString,
                        sourceName: sample.sourceRevision.source.name,
                        sourceId: sample.uuid.uuidString,
                        metadata: nil
                    )
                }
                continuation.resume(returning: payload)
            }
            store.execute(query)
        }
    }

    private func queryWorkouts(start: Date, end: Date) async throws -> [HealthSamplePayload] {
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(sampleType: .workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, samples, error in
                if let error { continuation.resume(throwing: error); return }
                let payload = (samples as? [HKWorkout] ?? []).map { workout in
                    HealthSamplePayload(
                        id: workout.uuid.uuidString,
                        type: "workout",
                        startAt: self.iso.string(from: workout.startDate),
                        endAt: self.iso.string(from: workout.endDate),
                        value: workout.duration / 60,
                        unit: "min",
                        sourceName: workout.sourceRevision.source.name,
                        sourceId: workout.uuid.uuidString,
                        metadata: ["activityType": String(workout.workoutActivityType.rawValue)]
                    )
                }
                continuation.resume(returning: payload)
            }
            store.execute(query)
        }
    }
}

enum BridgeError: LocalizedError {
    case healthUnavailable, invalidURL, missingPairing, badResponse
    var errorDescription: String? {
        switch self {
        case .healthUnavailable: "HealthKit is unavailable on this device."
        case .invalidURL: "The server URL is invalid."
        case .missingPairing: "Enter the user ID and sync token."
        case .badResponse: "The server rejected the sync."
        }
    }
}
