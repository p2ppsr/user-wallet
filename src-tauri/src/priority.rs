//! Platform-specific helpers to keep the process and critical threads at the
//! highest priority available without crashing if the OS denies the request.

#[cfg(target_os = "macos")]
mod platform {
    use std::io;

    const QOS_CLASS_USER_INTERACTIVE: u32 = 0x21;

    #[link(name = "System", kind = "framework")]
    extern "C" {
        fn pthread_set_qos_class_self_np(qos_class: u32, relative_priority: i32) -> i32;
    }

    pub fn elevate_process_priority() -> Result<(), String> {
        unsafe {
            if libc::setpriority(libc::PRIO_PROCESS, 0, -20) != 0 {
                let err = io::Error::last_os_error();
                if err.raw_os_error() != Some(libc::EPERM) {
                    return Err(format!("setpriority failed: {err}"));
                }
            }
        }
        Ok(())
    }

    pub fn elevate_current_thread_priority() -> Result<(), String> {
        unsafe {
            let ret = pthread_set_qos_class_self_np(QOS_CLASS_USER_INTERACTIVE, 0);
            if ret != 0 {
                let err = io::Error::from_raw_os_error(ret);
                return Err(format!("pthread_set_qos_class_self_np failed: {err}"));
            }
        }

        Ok(())
    }
}

#[cfg(target_os = "windows")]
mod platform {
    use std::io;
    use windows_sys::Win32::Foundation::GetLastError;
    use windows_sys::Win32::System::Threading::{
        GetCurrentProcess, GetCurrentThread, SetPriorityClass, SetThreadPriority,
        ABOVE_NORMAL_PRIORITY_CLASS, HIGH_PRIORITY_CLASS, REALTIME_PRIORITY_CLASS,
        THREAD_PRIORITY_HIGHEST, THREAD_PRIORITY_TIME_CRITICAL,
    };

    fn last_error() -> io::Error {
        io::Error::from_raw_os_error(unsafe { GetLastError() } as i32)
    }

    pub fn elevate_process_priority() -> Result<(), String> {
        unsafe {
            if SetPriorityClass(GetCurrentProcess(), REALTIME_PRIORITY_CLASS) == 0 {
                if SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS) == 0 {
                    if SetPriorityClass(GetCurrentProcess(), ABOVE_NORMAL_PRIORITY_CLASS) == 0 {
                        return Err(format!("SetPriorityClass failed: {}", last_error()));
                    }
                }
            }
        }
        Ok(())
    }

    pub fn elevate_current_thread_priority() -> Result<(), String> {
        unsafe {
            if SetThreadPriority(GetCurrentThread(), THREAD_PRIORITY_TIME_CRITICAL) == 0 {
                if SetThreadPriority(GetCurrentThread(), THREAD_PRIORITY_HIGHEST) == 0 {
                    return Err(format!("SetThreadPriority failed: {}", last_error()));
                }
            }
        }
        Ok(())
    }
}

#[cfg(target_os = "linux")]
mod platform {
    use std::io;

    pub fn elevate_process_priority() -> Result<(), String> {
        for priority in [-20, -15, -10] {
            let result = unsafe { libc::setpriority(libc::PRIO_PROCESS, 0, priority) };
            if result == 0 {
                return Ok(());
            }

            let err = io::Error::last_os_error();
            if err.raw_os_error() != Some(libc::EPERM) {
                return Err(format!("setpriority failed: {err}"));
            }
        }

        Err("Insufficient permissions to raise process priority".into())
    }

    pub fn elevate_current_thread_priority() -> Result<(), String> {
        unsafe {
            let tid = libc::syscall(libc::SYS_gettid) as libc::id_t;
            if libc::setpriority(libc::PRIO_PROCESS, tid, -20) == 0 {
                return Ok(());
            }

            let err = io::Error::last_os_error();
            if err.raw_os_error() != Some(libc::EPERM) {
                return Err(format!("thread setpriority failed: {err}"));
            }
        }

        Err("Insufficient permissions to raise thread priority".into())
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
mod platform {
    pub fn elevate_process_priority() -> Result<(), String> {
        Ok(())
    }

    pub fn elevate_current_thread_priority() -> Result<(), String> {
        Ok(())
    }
}

pub fn elevate_process_priority() -> Result<(), String> {
    platform::elevate_process_priority()
}

pub fn elevate_current_thread_priority() -> Result<(), String> {
    platform::elevate_current_thread_priority()
}
