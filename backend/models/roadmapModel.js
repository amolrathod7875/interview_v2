import mongoose from 'mongoose'

// Sub-schema for roadmap items to enable targeting by _id
const roadmapItemSchema = new mongoose.Schema({
    key: { type: String, required: true },
    value: { type: String, required: true },
    completed: { type: Boolean, default: false },
    quizScore: { type: Number, default: null }
}, { _id: true })

const roadmapModel = new mongoose.Schema({
    userId: { type: String, required: true },
    topic: { type: String, required: true },
    roadmap: {
        beginner: { 
            type: [roadmapItemSchema], 
            default: [] 
        },
        intermediate: { 
            type: [roadmapItemSchema], 
            default: [] 
        },
        advanced: { 
            type: [roadmapItemSchema], 
            default: [] 
        }
    }
}, { timestamps: true })

export default mongoose.model('Roadmap', roadmapModel)
