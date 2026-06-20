import cv2
import os
import sys

def reverse_video(input_path, output_path):
    print(f"Reversing {input_path} -> {output_path}...")
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(f"Error: Could not open {input_path}")
        return False
        
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Target resolution: max 1080p to keep file size small for web and git push
    target_width = width
    target_height = height
    if width > 1920 or height > 1080:
        target_width = 1920
        target_height = 1080
        print(f"Resizing output from {width}x{height} to {target_width}x{target_height}...")
    
    print(f"Specs: {width}x{height}, {fps} FPS, {total_frames} frames")
    
    # Create a temporary directory for frames to avoid OOM for large files (e.g. 4K)
    temp_dir = os.path.join(os.path.dirname(output_path), "temp_frames")
    if os.path.exists(temp_dir):
        import shutil
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir)
    
    count = 0
    success, frame = cap.read()
    while success:
        frame_path = os.path.join(temp_dir, f"frame_{count:06d}.jpg")
        cv2.imwrite(frame_path, frame, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        count += 1
        if count % 50 == 0:
            print(f"Read and saved {count}/{total_frames} frames...")
        success, frame = cap.read()
            
    cap.release()
    print(f"Total read frames: {count}")
    
    # Try different codecs
    # avc1 is H.264 (recommended for web)
    # mp4v is standard MPEG4
    codecs = ['avc1', 'mp4v', 'XVID', 'MJPG']
    out = None
    for codec in codecs:
        try:
            fourcc = cv2.VideoWriter_fourcc(*codec)
            out = cv2.VideoWriter(output_path, fourcc, fps, (target_width, target_height))
            if out.isOpened():
                print(f"Successfully initialized VideoWriter with codec: {codec}")
                break
        except Exception as e:
            print(f"Codec {codec} failed: {e}")
            
    if out is None or not out.isOpened():
        print("Error: Could not initialize any VideoWriter codec.")
        import shutil
        shutil.rmtree(temp_dir)
        return False
        
    for i in range(count - 1, -1, -1):
        frame_path = os.path.join(temp_dir, f"frame_{i:06d}.jpg")
        frame = cv2.imread(frame_path)
        if frame is not None:
            if target_width != width or target_height != height:
                frame = cv2.resize(frame, (target_width, target_height), interpolation=cv2.INTER_AREA)
            out.write(frame)
        if (count - i) % 50 == 0:
            print(f"Wrote {count - i}/{count} frames...")
            
    out.release()
    
    # Clean up temp frames
    import shutil
    shutil.rmtree(temp_dir)
    print("Finished reversing video successfully!")
    return True


if __name__ == '__main__':
    video_dir = 'public/videos'
    if not os.path.exists(video_dir):
        os.makedirs(video_dir)
        
    # Read blackholes.json to find which ones have yoyo = false
    import json
    yoyo_blacklist = []
    try:
        json_path = 'public/data/blackholes.json'
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for bh in data:
                    if bh.get('yoyo') == False:
                        video_url = bh.get('videoUrl', '')
                        filename = os.path.basename(video_url)
                        if filename:
                            yoyo_blacklist.append(filename)
            print(f"Skipping reversal for blacklisted videos (yoyo=false): {yoyo_blacklist}")
    except Exception as e:
        print(f"Could not read blackholes.json blacklist: {e}")
        
    for f in os.listdir(video_dir):
        if f.endswith('.mp4') and not f.endswith('_reversed.mp4'):
            if f in yoyo_blacklist:
                print(f"Skipping reversal for {f} (yoyo is set to false in blackholes.json)")
                continue
                
            input_path = os.path.join(video_dir, f)
            name, ext = os.path.splitext(f)
            output_path = os.path.join(video_dir, f"{name}_reversed.mp4")
            if not os.path.exists(output_path):
                reverse_video(input_path, output_path)
            else:
                print(f"Reversed video already exists for {f}")
