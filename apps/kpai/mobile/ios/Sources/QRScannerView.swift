import SwiftUI
import AVFoundation

enum ScanError: Error {
    case cancelled
    case noQRFound
    case cameraUnavailable
}

struct QRScannerView: UIViewControllerRepresentable {
    let onResult: (Result<String, ScanError>) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onResult: onResult)
    }

    func makeUIViewController(context: Context) -> ScannerViewController {
        ScannerViewController(coordinator: context.coordinator)
    }

    func updateUIViewController(_ uiViewController: ScannerViewController, context: Context) {}

    final class Coordinator: NSObject, AVCaptureMetadataOutputObjectsDelegate {
        let onResult: (Result<String, ScanError>) -> Void
        private var hasFired = false

        init(onResult: @escaping (Result<String, ScanError>) -> Void) {
            self.onResult = onResult
        }

        func metadataOutput(_ output: AVCaptureMetadataOutput,
                            didOutput metadataObjects: [AVMetadataObject],
                            from connection: AVCaptureConnection) {
            guard !hasFired,
                  let obj = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
                  let payload = obj.stringValue else { return }
            hasFired = true
            // Brief haptic + result
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            DispatchQueue.main.async { self.onResult(.success(payload)) }
        }

        @objc func cancelTapped() {
            DispatchQueue.main.async { self.onResult(.failure(.cancelled)) }
        }
    }
}

final class ScannerViewController: UIViewController {
    private let captureSession = AVCaptureSession()
    private let coordinator: QRScannerView.Coordinator
    private var previewLayer: AVCaptureVideoPreviewLayer?

    init(coordinator: QRScannerView.Coordinator) {
        self.coordinator = coordinator
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) not supported") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device),
              captureSession.canAddInput(input) else {
            DispatchQueue.main.async { self.coordinator.onResult(.failure(.cameraUnavailable)) }
            return
        }
        captureSession.addInput(input)

        let output = AVCaptureMetadataOutput()
        guard captureSession.canAddOutput(output) else {
            DispatchQueue.main.async { self.coordinator.onResult(.failure(.cameraUnavailable)) }
            return
        }
        captureSession.addOutput(output)
        output.setMetadataObjectsDelegate(coordinator, queue: .main)
        output.metadataObjectTypes = [.qr]

        let preview = AVCaptureVideoPreviewLayer(session: captureSession)
        preview.frame = view.layer.bounds
        preview.videoGravity = .resizeAspectFill
        view.layer.addSublayer(preview)
        previewLayer = preview

        addOverlay()
        addCancelButton()

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession.startRunning()
        }
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.layer.bounds
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        if captureSession.isRunning {
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                self?.captureSession.stopRunning()
            }
        }
    }

    private func addOverlay() {
        let dim = CAShapeLayer()
        let bounds = view.bounds
        let frame: CGFloat = min(bounds.width, bounds.height) * 0.7
        let rect = CGRect(
            x: (bounds.width - frame) / 2,
            y: (bounds.height - frame) / 2,
            width: frame,
            height: frame
        )
        let path = UIBezierPath(rect: bounds)
        path.append(UIBezierPath(roundedRect: rect, cornerRadius: 24).reversing())
        dim.path = path.cgPath
        dim.fillColor = UIColor.black.withAlphaComponent(0.55).cgColor
        view.layer.addSublayer(dim)

        let frameLayer = CAShapeLayer()
        frameLayer.path = UIBezierPath(roundedRect: rect, cornerRadius: 24).cgPath
        frameLayer.strokeColor = UIColor.white.cgColor
        frameLayer.lineWidth = 3
        frameLayer.fillColor = UIColor.clear.cgColor
        view.layer.addSublayer(frameLayer)

        let hint = UILabel()
        hint.text = "Point the camera at a craft QR code"
        hint.textColor = .white
        hint.font = .systemFont(ofSize: 16, weight: .semibold)
        hint.textAlignment = .center
        hint.numberOfLines = 0
        hint.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(hint)
        NSLayoutConstraint.activate([
            hint.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            hint.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            hint.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 24)
        ])
    }

    private func addCancelButton() {
        let button = UIButton(type: .system)
        button.setTitle("Cancel", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        button.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        button.layer.cornerRadius = 22
        button.contentEdgeInsets = UIEdgeInsets(top: 10, left: 22, bottom: 10, right: 22)
        button.addTarget(coordinator, action: #selector(QRScannerView.Coordinator.cancelTapped), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(button)
        NSLayoutConstraint.activate([
            button.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            button.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -32)
        ])
    }
}
