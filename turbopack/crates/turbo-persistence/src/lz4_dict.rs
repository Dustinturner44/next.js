use std::io;

use lz4::block::{CompressionMode, compress_to_buffer, decompress_to_buffer};

/// Compress data using LZ4 (dictionary support removed - using standard compression)
/// Note: The lz4 crate doesn't have direct dictionary support in its safe API
/// This implementation ignores the dictionary parameter for now
pub fn compress_with_dict(src: &[u8], _dict: &[u8]) -> io::Result<Vec<u8>> {
    let max_dst_size = max_compressed_size(src.len());
    let mut dst = vec![0u8; max_dst_size];

    let compressed_size = compress_to_buffer(
        src,
        Some(CompressionMode::DEFAULT),
        false, // don't prepend size
        &mut dst,
    )?;

    dst.truncate(compressed_size);
    Ok(dst)
}

/// Decompress data using LZ4 (dictionary support removed - using standard decompression)
/// Note: The lz4 crate doesn't have direct dictionary support in its safe API
/// This implementation ignores the dictionary parameter for now
pub fn decompress_with_dict(src: &[u8], dst: &mut [u8], _dict: &[u8]) -> io::Result<()> {
    let decompressed_size = decompress_to_buffer(src, Some(dst.len() as i32), dst)?;

    if decompressed_size != dst.len() {
        return Err(io::Error::other(format!(
            "Decompressed size mismatch: expected {}, got {}",
            dst.len(),
            decompressed_size
        )));
    }

    Ok(())
}

/// Get the maximum compressed size for a given input size
pub fn max_compressed_size(src_len: usize) -> usize {
    lz4::block::compress_bound(src_len).unwrap_or(src_len * 2)
}
