import mongoose from 'mongoose'

const roadmapModel = new mongoose.Schema({
    userId: { type: String, required: true },
    topic: { type: String, required: true },
    roadmap: {
        beginner: { 
            type: [{ key: String, value: String }], 
            default: [] 
        },
        intermediate: { 
            type: [{ key: String, value: String }], 
            default: [] 
        },
        advanced: { 
            type: [{ key: String, value: String }], 
            default: [] 
        }
    }
})
export default mongoose.model('Roadmap', roadmapModel)
