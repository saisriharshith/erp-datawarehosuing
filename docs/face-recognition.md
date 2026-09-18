# Face Recognition & Anti-Spoofing Engine

## 1. Deep Learning Pipeline Overview

VisionAttend leverages state-of-the-art deep metric learning powered by **InsightFace (buffalo_sc)** running on ONNX Runtime:

| Component | Model Name | Backbone | Input Dimensions | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Face Detection** | `det_500m.onnx` | SCRFD (MobileNet-style) | Dynamic ($640 \times 640$) | Localization, bounding boxes, 5-point facial landmarks |
| **Feature Extraction** | `w600k_mbf.onnx` | MobileFaceNet (ArcFace loss) | $112 \times 112 \times 3$ | 512-dimensional embedding on unit hypersphere |

---

## 2. Mathematical Formalism

### 2.1 ArcFace Feature Embeddings
ArcFace (Additive Angular Margin Loss) maps face crops $\mathbf{x} \in \mathbb{R}^{112 \times 112 \times 3}$ into a 512-dimensional feature space $\mathbb{R}^{512}$ constrained to the unit hypersphere:

$$\mathbf{v} = \frac{f(\mathbf{x})}{\|f(\mathbf{x})\|_2} \quad \text{where} \quad \|\mathbf{v}\|_2 = 1.0$$

Because all vectors lie on the surface of the unit hypersphere, Euclidean distance squared and Cosine similarity are monotonically equivalent:

$$d^2(\mathbf{u}, \mathbf{v}) = \|\mathbf{u} - \mathbf{v}\|_2^2 = 2 - 2(\mathbf{u} \cdot \mathbf{v}) = 2(1 - \cos \theta)$$

Hence, cosine similarity between a probe embedding $\mathbf{p}$ and an enrolled embedding $\mathbf{e}$ reduces to a single dot product:

$$\text{Sim}(\mathbf{p}, \mathbf{e}) = \sum_{k=1}^{512} p_k \cdot e_k$$

### 2.2 Multi-Sample Enrollment Scoring
Students enroll 3 to 5 face samples under distinct angles (frontal, left yaw, right yaw, slight tilt). To maximize verification accuracy and robustness against single-outlier poses, the system applies a weighted multi-sample scoring function:

$$\text{Score}(\mathbf{p}, S) = 0.70 \cdot \max_{e \in S}(\mathbf{p} \cdot \mathbf{e}) + 0.30 \cdot \text{second\_max}_{e \in S}(\mathbf{p} \cdot \mathbf{e})$$

If $\text{Score}(\mathbf{p}, S) \ge \tau$ (where $\tau$ is `FACE_SIMILARITY_THRESHOLD`), a match is confirmed.

---

## 3. Anti-Spoofing & Quality Heuristics

To prevent presentation attacks (e.g. holding up a smartphone photograph or tablet screen), the system applies multi-stage defense heuristics:

1. **Laplacian Blur / Texture Variance**:
   $$\text{Sharpness} = \text{Var}\left(\nabla^2 I\right) \ge 80.0$$
   Screen replays and low-quality printouts display distinctive moiré fringes or low-pass softening.
2. **Face Bounding Box Ratio**:
   The face area must comprise between 8% and 75% of the camera frame to prevent micro-detections or distant background passersby.
3. **Head Pose Yaw & Pitch Verification**:
   During active enrollment, 5-point facial landmarks compute head yaw:
   $$\text{Yaw Ratio} = \frac{\text{dist}(\text{nose}, \text{left\_eye})}{\text{dist}(\text{nose}, \text{right\_eye})}$$
   The system prompts the student to turn left and right, ensuring a 3D volumetric face is physically present before accepting the sample.
